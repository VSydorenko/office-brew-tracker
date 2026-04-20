

## Уточнений план виправлення (підтверджено фактами)

### Підтвердження діагнозу

**Проблема з ціною — підтверджена через прямий запит до БД:**
- RPC `get_coffee_purchase_stats()` повертає `last_price` типу `numeric` як **рядок** `"335.00"` (це стандартна поведінка supabase-js для PostgreSQL `numeric`, бо JS `Number` втрачає точність).
- TypeScript-тип у `types.ts` каже `last_price: number` — **це некоректно** і вводить код в оману.
- Поточна перевірка `stat.lastPrice > 0` проходить через JS coercion ("335.00" > 0 === true), але потім `unit_price = "335.00"` (рядок) ламає арифметику в `reduce((sum, item) => sum + (item.unit_price || 0), 0)` → конкатенація замість додавання → `total_amount` не оновлюється коректно, що видно як "ціна не заповнюється".

**Проблема зі скролом у Drawer — підтверджена аналізом drawer.tsx:**
- `DrawerContent` рендериться як `vaul`-примітив, який перехоплює touch-жести для drag-to-dismiss.
- Зараз `overflow-y-auto` стоїть на самому `DrawerContent` (рядок 649) — Vaul через це не розуміє, де область скролу, і блокує жести вертикальної прокрутки на мобільних, коли контент перевищує висоту.
- Розв'язання: перенести `overflow-y-auto` на **внутрішній** `div` навколо контенту форми. Vaul автоматично детектить вкладені scroll-контейнери та пропускає скрол-жести в них (атрибут `data-vaul-no-drag` не потрібен — це підхід з офіційних прикладів shadcn).

### Зміни

**Файл 1: `src/hooks/use-coffee-types.ts`** — виправити джерело проблеми

В `useCoffeePurchaseStatsMap` явно нормалізувати `lastPrice` через `Number()` при побудові Map, щоб усі споживачі отримували вже числове значення:

```typescript
map.set(stat.coffee_type_id, {
  lastPrice: Number(stat.last_price) || 0,
  lastPurchaseDate: stat.last_purchase_date,
});
```

Це централізоване виправлення — після нього `CoffeeCombobox`, `CoffeeCard`, `PurchaseFormDialog` отримують гарантовано `number`.

**Файл 2: `src/components/purchases/PurchaseFormDialog.tsx`** — виправити Drawer-скрол

Замінити (рядок 649):
```tsx
<DrawerContent className="max-h-[90vh] overflow-y-auto px-4 pb-6">
  <DrawerHeader className="px-0">...</DrawerHeader>
  {renderFormContent()}
</DrawerContent>
```

На:
```tsx
<DrawerContent className="max-h-[90vh] flex flex-col">
  <DrawerHeader className="px-4">...</DrawerHeader>
  <div className="overflow-y-auto px-4 pb-6 flex-1">
    {renderFormContent()}
  </div>
</DrawerContent>
```

Ключові зміни:
- `flex flex-col` на `DrawerContent` — щоб внутрішній скрол-контейнер міг розтягнутись
- `overflow-y-auto` на внутрішньому `div`, а не на Vaul-примітиві — Vaul пропустить touch-жести скролу
- `flex-1` — щоб скрол-зона займала весь доступний простір під заголовком

### Чому одного виправлення в хуку достатньо для ціни

Не потрібно правити код у `PurchaseFormDialog` чи `CoffeeCombobox` окремо — джерело даних одне (`useCoffeePurchaseStatsMap`), нормалізація на рівні хука гарантує коректний тип усюди. Це відповідає принципу single source of truth.

### Файли для зміни

| Файл | Зміна | Рядки |
|---|---|---|
| `src/hooks/use-coffee-types.ts` | `Number(stat.last_price)` у Map | ~365-368 |
| `src/components/purchases/PurchaseFormDialog.tsx` | Перенести `overflow-y-auto` всередину | 649-657 |

### Результат
- Остання ціна автоматично заповнюється у позицію покупки і коректно сумується в `total_amount`
- На мобільних форма скролиться вниз до кнопки "Зберегти" навіть з кількома позиціями кави

