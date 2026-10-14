/**
 * Розгортає відповідь Supabase: повертає data або кидає помилку з повідомленням Supabase.
 * @param result Результат запиту Supabase у форматі { data, error }
 * @returns Дані без обгортки
 */
export function unwrap<T>(result: { data: T; error: { message?: string } | null }): NonNullable<T> {
  if (result.error) {
    throw new Error(result.error.message || 'Помилка завантаження даних');
  }
  return result.data as NonNullable<T>;
}
