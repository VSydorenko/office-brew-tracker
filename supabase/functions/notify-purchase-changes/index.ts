// Edge Function для автоматичних сповіщень при змінах покупок
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  record: any
  old_record?: any
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const payload: WebhookPayload = await req.json()
    console.log('Webhook payload:', payload)

    // Обробка змін в purchase_distributions (нові борги/доплати)
    if (payload.table === 'purchase_distributions' && payload.type === 'INSERT') {
      const distribution = payload.record
      
      // Отримуємо дані покупки та профіль покупця
      const { data: purchaseData } = await supabaseClient
        .from('purchases')
        .select(`
          date,
          total_amount,
          buyer_id,
          profiles!purchases_buyer_id_fkey(name)
        `)
        .eq('id', distribution.purchase_id)
        .single()

      if (purchaseData && distribution.user_id !== purchaseData.buyer_id) {
        // Це новий борг для користувача
        console.log(`Новий борг для користувача ${distribution.user_id}: ${distribution.calculated_amount} ₴`)
        
        // Тут можна інтегрувати з push-сервісом або іншими системами сповіщень
        // Наприклад, зберегти в таблицю notifications для подальшої обробки
        
        await supabaseClient
          .from('notifications')
          .insert({
            user_id: distribution.user_id,
            type: distribution.adjustment_type || 'debt',
            title: distribution.adjustment_type === 'charge' ? 'Нова доплата' : 
                   distribution.adjustment_type === 'refund' ? 'Повернення коштів' : 'Новий борг',
            message: `${purchaseData.profiles?.name || 'Покупець'} ${
              distribution.adjustment_type === 'charge' ? 'створив доплату' :
              distribution.adjustment_type === 'refund' ? 'повертає кошти' :
              'додав покупку'
            } на ${(distribution.calculated_amount || distribution.adjusted_amount || 0).toFixed(2)} ₴`,
            data: {
              purchase_id: distribution.purchase_id,
              distribution_id: distribution.id,
              amount: distribution.calculated_amount || distribution.adjusted_amount,
              purchase_date: purchaseData.date,
              buyer_name: purchaseData.profiles?.name
            },
            is_read: false
          })
      }
    }

    // Обробка змін статусу покупок
    if (payload.table === 'purchases' && payload.type === 'UPDATE') {
      const newPurchase = payload.record
      const oldPurchase = payload.old_record
      
      // Перевіряємо зміну статусу
      if (oldPurchase?.distribution_status !== newPurchase?.distribution_status) {
        console.log(`Зміна статусу покупки ${newPurchase.id}: ${oldPurchase?.distribution_status} -> ${newPurchase?.distribution_status}`)
        
        // Отримуємо всіх користувачів пов'язаних з покупкою
        const { data: distributions } = await supabaseClient
          .from('purchase_distributions')
          .select('user_id')
          .eq('purchase_id', newPurchase.id)
        
        if (distributions) {
          // Створюємо сповіщення для всіх пов'язаних користувачів
          const notifications = distributions
            .filter(dist => dist.user_id !== newPurchase.buyer_id) // Виключаємо покупця
            .map(dist => ({
              user_id: dist.user_id,
              type: 'purchase_status',
              title: 'Зміна статусу покупки',
              message: getStatusMessage(newPurchase.distribution_status),
              data: {
                purchase_id: newPurchase.id,
                old_status: oldPurchase?.distribution_status,
                new_status: newPurchase.distribution_status,
                purchase_date: newPurchase.date,
                total_amount: newPurchase.total_amount
              },
              is_read: false
            }))
          
          if (notifications.length > 0) {
            await supabaseClient
              .from('notifications')
              .insert(notifications)
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error processing webhook:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})

function getStatusMessage(status: string): string {
  switch (status) {
    case 'active':
      return 'Покупка готова до оплати'
    case 'locked':
      return 'Покупка повністю оплачена'
    case 'amount_changed':
      return 'Сума покупки була змінена'
    default:
      return 'Статус покупки змінено'
  }
}