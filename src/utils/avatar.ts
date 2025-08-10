import { supabase } from "@/integrations/supabase/client";

/**
 * In-memory кеш для URL аватарів
 */
const urlCache = new Map<string, string>();

/**
 * Генерує URL для аватара користувача зі Supabase Storage
 * @param avatarPath - Шлях до файлу аватара в storage
 * @returns URL для аватара або null якщо помилка
 */
export function getAvatarUrl(avatarPath?: string | null): string | null {
  if (!avatarPath) return null;
  
  // Перевіряємо кеш
  if (urlCache.has(avatarPath)) {
    return urlCache.get(avatarPath)!;
  }
  
  try {
    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(avatarPath);
    
    const url = data.publicUrl;
    urlCache.set(avatarPath, url);
    return url;
  } catch (error) {
    console.error('Error getting avatar URL:', error);
    return null;
  }
}

/**
 * Оптимізує Google Avatar URL додавши параметри розміру
 * @param googleAvatarUrl - Оригінальний URL Google аватара
 * @param size - Бажаний розмір (за замовчуванням 200px)
 * @returns Оптимізований URL або оригінальний
 */
export function optimizeGoogleAvatarUrl(googleAvatarUrl?: string | null, size: number = 200): string | null {
  if (!googleAvatarUrl) return null;
  
  // Перевіряємо чи це Google Avatar URL
  if (googleAvatarUrl.includes('googleusercontent.com') || googleAvatarUrl.includes('lh3.googleusercontent.com')) {
    // Видаляємо існуючі параметри розміру та додаємо новий
    const baseUrl = googleAvatarUrl.split('=')[0];
    return `${baseUrl}=s${size}-c`;
  }
  
  return googleAvatarUrl;
}

/**
 * Завантажує файл аватара в Supabase Storage
 * @param file - Файл зображення для завантаження
 * @param userId - ID користувача для створення унікального шляху
 * @returns Шлях до завантаженого файлу в storage
 * @throws Error якщо завантаження не вдалося
 */
export async function uploadAvatar(file: File, userId: string): Promise<string> {
  const rawExt = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const fileExt = rawExt === 'jpeg' ? 'jpg' : rawExt;
  const timestamp = Date.now();
  const fileName = `${userId}/avatar_${timestamp}.${fileExt}`;
  
  const { error } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, {
      upsert: true // Дозволяємо заміну, але ім'я унікальне для кеш-бастингу
    });
  
  if (error) {
    throw new Error(`Помилка завантаження: ${error.message}`);
  }
  
  return fileName;
}

/**
 * Видаляє аватар користувача з Supabase Storage
 * @param avatarPath - Шлях до файлу аватара в storage
 * @throws Error якщо видалення не вдалося
 */
export async function removeAvatar(avatarPath: string): Promise<void> {
  const { error } = await supabase.storage
    .from('avatars')
    .remove([avatarPath]);
  
  if (error) {
    throw new Error(`Помилка видалення: ${error.message}`);
  }
  
  // Очищаємо кеш
  urlCache.delete(avatarPath);
}

/**
 * Стискає зображення на клієнті для економії місця
 * @param file - Файл зображення для стиснення
 * @param maxWidth - Максимальна ширина в пікселях (за замовчуванням 200)
 * @param quality - Якість стиснення від 0 до 1 (за замовчуванням 0.8)
 * @returns Promise з стиснутим файлом у форматі JPEG
 */
export function compressImage(
  file: File, 
  maxWidth: number = 200, 
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      // Зберігаємо пропорції, не масштабуємо вгору
      const ratio = Math.min(1, maxWidth / Math.max(img.width, img.height));
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);
      
      // Якісне згладжування
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Малюємо стиснуте зображення
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob(
        (blob) => {
          const compressedFile = new File([blob!], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          URL.revokeObjectURL(objectUrl);
          resolve(compressedFile);
        },
        'image/jpeg',
        quality
      );
    };
    
    img.src = objectUrl;
  });
}