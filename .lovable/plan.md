

## План оптимізації: єдиний механізм вибору кави та інформація про останню покупку

### Крок 1: Створити DB-функцію для отримання останніх покупок всіх кав одним запитом

Замість N окремих викликів `get_latest_coffee_price` для кожної кави, створити одну функцію `get_coffee_purchase_stats()`, яка повертає для кожної кави:
- `coffee_type_id` -- ID кави
- `last_price` -- остання ціна за упаковку
- `last_purchase_date` -- дата останньої покупки

```sql
CREATE OR REPLACE FUNCTION public.get_coffee_purchase_stats()
RETURNS TABLE(coffee_type_id uuid, last_price numeric, last_purchase_date date)
LANGUAGE sql STABLE
SET search_path TO 'public'
AS $$
  SELECT DISTINCT ON (pi.coffee_type_id)
    pi.coffee_type_id,
    pi.unit_price as last_price,
    p.date as last_purchase_date
  FROM purchase_items pi
  JOIN purchases p ON pi.purchase_id = p.id
  WHERE pi.unit_price IS NOT NULL
  ORDER BY pi.coffee_type_id, p.date DESC, p.created_at DESC;
$$;
```

### Крок 2: Створити React Query хук `useCoffeePurchaseStats`

**Файл:** `src/hooks/use-coffee-types.ts`

Додати новий хук, який:
- Викликає `get_coffee_purchase_stats()` одним запитом
- Кешує результат на 5 хвилин
- Повертає Map для швидкого доступу за `coffeeId`

```typescript
export function useCoffeePurchaseStats() {
  return useSupabaseQuery(
    ['coffee-purchase-stats'],
    async () => supabase.rpc('get_coffee_purchase_stats'),
    { staleTime: 5 * 60 * 1000 }
  );
}
```

Також додати хелпер-хук `useCoffeePurchaseStatsMap()`, який повертає `Map<string, { lastPrice, lastPurchaseDate }>` для зручного доступу.

### Крок 3: Оновити `CoffeeCombobox` -- додати дату останньої покупки

**Файл:** `src/components/purchases/CoffeeCombobox.tsx`

- Замінити пропси `showLastPrice`, `onGetLastPrice` на використання `useCoffeePurchaseStatsMap()` безпосередньо всередині компонента
- Поруч з ціною показувати дату останньої покупки: `"₴350/уп. -- 15.02.2026"`
- Якщо покупок не було: `"Ще не купувалась"`

### Крок 4: Видалити дублювання з `PurchaseFormDialog`

**Файл:** `src/components/purchases/PurchaseFormDialog.tsx`

- Видалити локальний `priceCache` (useState, useEffect з Promise.all)
- Видалити пропси `showLastPrice` та `onGetLastPrice` при виклику CoffeeCombobox
- CoffeeCombobox сам отримує дані через хук
- При виборі кави -- брати ціну з `useCoffeePurchaseStatsMap()` замість окремого RPC-виклику

### Крок 5: Видалити дублювання `useCreateCoffeeType` з `use-purchases.ts`

**Файл:** `src/hooks/use-purchases.ts`

- Видалити функцію `useCreateCoffeeType` (рядки 562-579)
- В `PurchaseFormDialog` вже імпортується `useCreateCoffeeType` з `use-coffee-types.ts` -- залишити тільки його

### Крок 6: Оновити `CoffeeCard` -- показувати останню покупку замість дати створення

**Файл:** `src/components/coffee/CoffeeCard.tsx`

- Використати `useCoffeePurchaseStatsMap()` для отримання даних
- Замінити `"Додано: {created_at}"` на:
  - Якщо є дані: `"Остання покупка: 15.02.2026 -- ₴350/уп."`
  - Якщо немає: `"Ще не купувалась"`

### Крок 7: Оновити `CoffeeList` -- додати сортування за останньою покупкою

**Файл:** `src/components/coffee/CoffeeList.tsx`

- За замовчуванням сортувати кави за датою останньої покупки (найновіші зверху)
- Кави без покупок -- в кінці списку

---

## Що залишається, що видаляється

| Компонент | Статус | Призначення |
|---|---|---|
| `CoffeeCombobox` | Залишається (оновлюється) | Вибір кави у формі покупки |
| `SearchableSelect` | Залишається без змін | Загальний select з пошуком (використовується в інших місцях) |
| `SelectEdit` | Залишається без змін | Inline-редагування select-полів |
| `priceCache` в PurchaseFormDialog | Видаляється | Замінюється хуком |
| `useCreateCoffeeType` в use-purchases.ts | Видаляється | Дублікат |
| `useLatestCoffeePrice` в use-purchases.ts | Залишається | Може знадобитись для одиничних запитів |

---

## Технічні деталі

**Нова DB-функція:** `get_coffee_purchase_stats()` -- один запит замість N

**Новий хук:** `useCoffeePurchaseStats()` + `useCoffeePurchaseStatsMap()` в `use-coffee-types.ts`

**Зміни у файлах:**
1. `supabase/migrations/` -- нова міграція з функцією
2. `src/hooks/use-coffee-types.ts` -- додати 2 хуки
3. `src/components/purchases/CoffeeCombobox.tsx` -- використати хук, додати дату
4. `src/components/purchases/PurchaseFormDialog.tsx` -- видалити priceCache, спростити
5. `src/hooks/use-purchases.ts` -- видалити дублікат useCreateCoffeeType
6. `src/components/coffee/CoffeeCard.tsx` -- замінити created_at на останню покупку
7. `src/components/coffee/CoffeeList.tsx` -- сортування за останньою покупкою
8. `src/lib/query-client.ts` -- додати ключ `coffeePurchaseStats`
