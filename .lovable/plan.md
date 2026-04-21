

# Аудит проекту: dead code, code smells, оптимізація БД та React Query

Я провів комплексний огляд кодової бази. Нижче — структурований звіт з висновками і план рефакторингу. Реалізацію розбито на **6 фаз**, кожну можна виконати окремо.

---

## A. Знайдені проблеми

### A1. Dead code (повністю не використовується)

| Файл | Що це | Рекомендація |
|---|---|---|
| `src/components/coffee/InlineSelectEdit.tsx` | Замінений на `SelectEdit` (`src/components/ui/select-edit.tsx`). Жоден імпорт. | **Видалити** |
| `src/utils/offline-storage.ts` (`saveOfflineData`, `removeOfflineData`) | Експортується, але ніде не викликається — записи в offline-сховище ніколи не створюються | **Видалити функції-«писалки»** + спростити модуль |
| `src/components/ui/offline-sync.tsx` | Симулює синхронізацію через `setTimeout` і завжди `clearOfflineData()`. Реальної логіки немає. | **Видалити** + зняти з `App.tsx` |
| `src/hooks/use-purchases.ts` → `useSearchPurchases`, `useRecentPurchases` | `useSearchPurchases` ніде не імпортується (фільтрація живе у `PurchaseList`). `useRecentPurchases` дублює `useRecentPurchasesDashboard` з `use-dashboard.ts`. | **Видалити обидва** |
| Коментар-привид у `use-purchases.ts:559` `// useCreateCoffeeType видалено...` | Залишок попереднього рефакторингу | **Видалити коментар** |

### A2. Дублювання логіки

1. **Lookup-довідники для форми кави** — `CoffeeForm.tsx` і `CoffeeEditDialog.tsx` мають однаковий блок `Promise.all([...5 запитів...])` для brands/flavors/methods/varieties/origins. Уже існують готові React Query хуки в `use-reference-tables.ts`, які кешують ці дані.
2. **`CoffeeEditDialog.tsx` повністю дублює** логіку `CoffeeForm.tsx` — ті самі поля, ті самі lookup-запити, окремий fetch flavors через raw `supabase`. Оскільки на сторінці `CoffeeDetail` редагування вже зроблено через inline-компоненти (`InlineTextEdit`, `SelectEdit`, `MultiSelectEdit`), `CoffeeEditDialog` дублює функціонал.
3. **Сторінка `Settings.tsx` → вкладка «Аналітика»** — placeholder «Дашборд аналітики в розробці...». Всі реальні аналітичні дані вже відображаються на `Dashboard.tsx`. Видалити вкладку.
4. **`PurchaseDistributionStep.tsx`** дублює свою логіку округлення часток із утилітою `buildDistributionsFromShares` з `use-purchases.ts`. Дві різні реалізації одного алгоритму.

### A3. Обхід React Query (raw Supabase у компонентах)

Ці компоненти роблять прямі запити в БД, ігноруючи React Query кеш і Realtime-інвалідацію. Це викликає **зайві HTTP-запити** і **локальний loading-стан** замість централізованого:

| Файл | Що робить напряму | Рекомендація |
|---|---|---|
| `DistributionTemplateForm.tsx` | `fetchProfiles()`, `fetchTemplateData()`, INSERT/UPDATE template + users | Замінити на хуки `useProfiles()` + новий `useDistributionTemplate(id)` + `useUpsertDistributionTemplate()` |
| `DistributionTemplateList.tsx` | `fetchTemplates()`, DELETE, UPDATE is_active | Новий `useDistributionTemplates()` + `useDeleteTemplate()` + `useToggleTemplate()`; з Realtime-інвалідацією |
| `PurchaseDistributionStep.tsx` | `fetchActiveTemplates()` з фільтром по `effective_from <= purchaseDate` | Новий `useActiveDistributionTemplates(date)` |
| `PurchaseDistributionPayments.tsx` | `supabase.auth.getUser()` в `useEffect`, UPDATE розподілу | Замінити на `useAuth().user`, мутацію винести в `useUpdateDistributionPayment()` |
| `PurchaseDistributionActions.tsx` | `fetchPurchaseData`, UPDATE `purchases`, складна логіка перерозподілу | Винести в нові мутації `useLockPurchase`, `useUnlockPurchase`, `useRedistribute`, `useCreateAdditionalPayments` |
| `ReferenceItemList.tsx` / `ReferenceItemForm.tsx` | `(supabase as any).from(tableName)` через any-cast | Узагальнений хук `useReferenceTable(tableName)` (CRUD з generic-параметром) |
| `CoffeeForm.tsx` / `CoffeeEditDialog.tsx` | 5 паралельних запитів до lookup-таблиць | Використати існуючі `useBrands()`, `useFlavors()`, `useVarieties()`, `useOrigins()`, `useProcessingMethods()` |
| `CoffeeCard.tsx` | DELETE `coffee_flavors` + `coffee_types` напряму | Використати існуючий `useDeleteCoffeeType()` з `use-coffee-types.ts` |
| `Navigation.tsx` (signOut), `Auth.tsx`, `WaitingApproval.tsx` | Виклики `supabase.auth.*` | **Залишити** — це auth, не бізнес-дані |

### A4. Проблеми React Query / кешу

1. **Дублі query-keys** — `use-reference-tables.ts` використовує `['brands']`, `['flavors']`, тощо, в той час як в `query-client.ts` визначені `queryKeys.reference.brands = ['reference', 'brands']`. Через це централізовані ключі не використовуються — інвалідація з інших місць не працює. **Привести всі ключі до `queryKeys.reference.*`**.
2. **`useRecentPurchases` (limit) у `use-purchases.ts`** vs **`useRecentPurchasesDashboard` (limit) у `use-dashboard.ts`** — той самий RPC, той самий ключ, два хуки. Лишити один.
3. **`Promise.all([...5 supabase.from...])` у `CoffeeForm`/`CoffeeEditDialog`** — кожен раз фетчить заново, без кешу. Хуки `useBrands` тощо вже кешують.
4. **`useRealtimeInvalidation` багато разів підписується на одну таблицю** — `purchases` realtime канал створюється у `use-purchases.ts` і `use-dashboard.ts` окремо. Це створює два окремих WebSocket-канали для тієї самої таблиці. Можна об'єднати або хоча б використати спільний канал (`channelName` як параметр).
5. **`MyPayments.tsx`** — три окремих `useSupabaseQuery` (`owedToMe`, `iOwe`, `allDistributions`) з перетином даних. `allDistributions` отримує всі мої розподіли, з яких можна було б похідно обчислити `owedToMe` і `iOwe`. **Спростити до одного запиту + `useMemo`-фільтрів**.
6. **`useCoffeeTypes(searchQuery)`** приймає `searchQuery`, але кешує під ключем `queryKeys.coffeeTypes.all` (без врахування `searchQuery`). При зміні пошуку повертає закешовані результати. **Або прибрати параметр**, або додати в ключ.

### A5. Проблеми БД / RPC

1. **Функція `get_recent_purchases_enriched`** не приймає фільтри — завжди повертає всі покупки, обмежуючи лише `limit`. Дублюється з `useDashboardKPIs` (різні агрегати для тих самих даних). Можна використати єдиний пакетний RPC.
2. **`get_top_drivers_with_monthly`** робить 2 проходи (cte `drivers` + cte `monthly`). Можна оптимізувати в одну агрегацію.
3. **Trigger `calculate_percentage_from_shares`** — оновлює `total_shares` у `distribution_templates` після кожного INSERT/UPDATE/DELETE одного користувача. Якщо вставляти 10 користувачів одночасно, тригер виконується 10 разів. Можна використати `STATEMENT`-level trigger замість `ROW`-level.
4. **N запитів при видаленні покупки** в `useDeletePurchase` — 4 послідовні DELETE. Можна замінити на один RPC або налаштувати CASCADE foreign keys (зараз `No foreign keys` у БД-схемі — взагалі немає FK, тому видалення сирітських даних на застосунку!).
5. **`profiles_guard_non_admin`** — тригер описаний, але в схемі бачимо `There are no triggers in the database` (мабуть, прибрали). Якщо так — небезпека: користувач може змінити свій `role`/`status`. **Перевірити RLS UPDATE policy на `profiles`** — зараз вона `auth.uid() = id`, що дозволяє користувачу написати `update profiles set role='admin' where id=auth.uid()`.

### A6. Code smells / UX

1. **`PurchaseList.tsx` — `useCanDeletePurchase(purchase.id)` викликається на кожній картці** — N запитів для N покупок. Краще один пакетний запит до RPC `get_undeletable_purchase_ids()` або обчислювати на основі `purchase_distributions`, які вже є в `usePurchases()` join.
2. **`PurchaseDistributionPayments.tsx`** — `supabase.auth.getUser()` у `useEffect` на кожному монтажі. Замінити на `useAuth().user` (вже є контекст).
3. **`PurchaseDistributionPayments.tsx → autoPayBuyer`** — викликає мутацію автоматично, без debounce, в `useEffect` залежному від `distributions`. Може спричинити race conditions при швидких оновленнях.
4. **`UserManagement.tsx`** — `updateStatus(id, 'blocked')` фактично викликає `rejectMutation` (статус буде `rejected`, не `blocked`). UI обіцяє блокування, БД пише відмову. Або додати `'blocked'` обробку, або прибрати кнопку.
5. **`MyPayments.tsx`** — фільтрація по `purchases.buyer_id` робиться двічі (через окремі queries + знову через `getFilteredData`). Дублювання логіки.
6. **`PurchaseDistributionStep.tsx`** — `useEffect` на `[totalAmount]` перерахунок — не залежить від `distributions` довжини, можуть випадати застарілі дані.
7. **`Consumption.tsx` → `refreshTrigger` + `DistributionTemplateList`** — primitive prop trigger pattern замість використання React Query інвалідації.
8. **`CoffeeList.tsx`** — `coffees.useMemo` робить трансформацію типу (rename `lastPurchaseDate` тощо). Зайве, бо інтерфейс і так сумісний.

---

## B. План рефакторингу — 6 фаз

### Фаза 1 — Видалення мертвого коду (швидко, безризиково)
- Видалити: `InlineSelectEdit.tsx`, `offline-sync.tsx`, `OfflineSync` з `App.tsx`
- Видалити з `offline-storage.ts` — `saveOfflineData`, `removeOfflineData` (залишити лише типи якщо потрібні; або весь файл)
- Видалити з `use-purchases.ts`: `useSearchPurchases`, `useRecentPurchases`, привид-коментар
- Видалити вкладку «Аналітика» в `Settings.tsx` (placeholder)
- Перевести використання `useRecentPurchases` → `useRecentPurchasesDashboard` (єдиний хук)

### Фаза 2 — Уніфікація query-keys
- Перевести `use-reference-tables.ts` на `queryKeys.reference.*`
- Перевірити, що `useUpdateCoffeeField` інвалідовує `queryKeys.coffeeTypes.detail(id)` (зараз тільки `.all`)
- Виправити `useCoffeeTypes(searchQuery)`: або прибрати параметр (фільтрація вже в `CoffeeList.useMemo`), або додати search у ключ

### Фаза 3 — Створення відсутніх React Query хуків
Новий файл `src/hooks/use-distribution-templates.ts`:
- `useDistributionTemplates()` — список з Realtime
- `useActiveDistributionTemplates(date)` — для `PurchaseDistributionStep`
- `useDistributionTemplate(id)` — для редагування
- `useUpsertDistributionTemplate()` — створення/оновлення (один хук з гілкою insert/update)
- `useDeleteDistributionTemplate()`
- `useToggleDistributionTemplate()`

Новий хук `useReferenceTable(tableName)` у `use-reference-tables.ts` — generic CRUD для `ReferenceItemList` / `ReferenceItemForm`, прибрати `(supabase as any)`.

Розширення `use-purchases.ts`:
- `useLockPurchase()`, `useUnlockPurchase()`
- `useRedistributePurchase()`, `useCreateAdditionalPayments()`
- `useUpdateDistributionPayment()` (для PurchaseDistributionPayments)

### Фаза 4 — Перевести компоненти на хуки
- `CoffeeForm.tsx` / `CoffeeEditDialog.tsx` → видалити `Promise.all` lookup, використати `useBrands/useFlavors/...`
- **Оцінити можливість видалити `CoffeeEditDialog.tsx`** повністю — у `CoffeeDetail.tsx` редагування вже працює через inline. Замінити кнопку «Редагувати» на картці на навігацію в `/coffee-catalog/:id`. Це усуне ще один дублюючий компонент.
- `DistributionTemplateForm.tsx` / `DistributionTemplateList.tsx` → переробити на нові хуки
- `PurchaseDistributionStep.tsx` → новий хук + використати `buildDistributionsFromShares` (експортувати з `use-purchases.ts`) замість дубльованої логіки округлення
- `PurchaseDistributionPayments.tsx` → `useAuth().user` замість `supabase.auth.getUser()`, мутації через хук
- `PurchaseDistributionActions.tsx` → перевести на нові мутації
- `CoffeeCard.tsx` → використати `useDeleteCoffeeType()` (вже існує)
- `MyPayments.tsx` → один запит `useMyDistributions()` + `useMemo` для розбиття

### Фаза 5 — Оптимізація запитів
- `useCanDeletePurchase` (N+1) → один RPC `get_undeletable_purchase_ids()` або обчислити з `purchase_distributions` що вже завантажені у `usePurchases()`
- Об'єднати Realtime-канали `purchases` (зараз два — у `use-purchases.ts` і `use-dashboard.ts`) в один, з multiple invalidation targets
- Замінити серію DELETE у `useDeletePurchase` на CASCADE FK або один RPC `delete_purchase_cascade(id)`

### Фаза 6 — Безпека БД (критично — окремою задачею)
- **Перевірити RLS на `profiles` UPDATE** — обмежити поля, що можна змінити (без `role`, `status`, `approved_by`, `approved_at`). Створити `profiles_guard_non_admin` тригер як описано в db-functions, якщо його реально нема.
- Виправити `UserManagement` `'blocked'` — або додати окрему мутацію, або прибрати кнопку.
- Додати foreign keys з ON DELETE CASCADE для `purchase_items.purchase_id`, `purchase_distributions.purchase_id`, `coffee_flavors.coffee_type_id`, `distribution_template_users.template_id`.

---

## C. Оцінка зусиль і ризиків

| Фаза | Зусилля | Ризик | Ефект |
|---|---|---|---|
| 1. Dead code | S | Дуже низький | Чистіша кодова база, –500 рядків |
| 2. Query keys | S | Низький | Працююча інвалідація з різних місць |
| 3. Нові хуки | M | Низький | Підготовка до фази 4 |
| 4. Перевід компонентів | L | Середній — багато компонентів торкаємо | Менше HTTP-запитів, кешування, єдиний шар даних |
| 5. БД оптимізація | M | Середній — нова RPC + FK міграції | Швидший рендер списку покупок (N+1 → 1) |
| 6. Безпека БД | S | **Високий, якщо RLS дійсно дірява** | Запобігання privilege escalation |

---

## D. Технічні деталі (для перевірки перед виконанням)

- **Чи `CoffeeEditDialog` справді можна видалити?** — Перевірити, що `/coffee-catalog/:id` (CoffeeDetail) повністю покриває функціонал. Так, всі поля доступні для редагування.
- **`refreshTrigger` patterns** у `Consumption`, `ReferenceTableManager` — після переходу на React Query більше не потрібні; інвалідовуємо ключі.
- **`PurchaseDistributionPayments → autoPayBuyer`** — потрібно дослідити, чи це бажана поведінка (автовідмітка покупця як «оплачено»). Якщо так — перенести в БД-тригер на INSERT `purchase_distributions`.

---

## Що залишаю поза скоупом цієї пропозиції

- Перебудова auth-механіки (працює коректно)
- Зміни UI/візуалу
- Edge function `notify-purchase-changes` (не аналізував детально)
- PWA/manifest

Якщо погоджуєш план, рекомендую починати з **Фази 1 + 2** як швидкого виграшу, потім окремими сесіями виконати **3+4** і **5+6**.

