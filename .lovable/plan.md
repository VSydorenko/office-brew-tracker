# План: queryOptions + лоадери TanStack Router (поетапно)

Мета: дані сторінок починають завантажуватись ще під час переходу (prefetch при наведенні на пункт меню), без «миготіння» спінерів, з одним джерелом правди для ключів кешу.

## Принципи
- Кожен запит описується один раз як фабрика `queryOptions` у `src/queries/<домен>.ts` (ключ з `queryKeys`, queryFn, select, staleTime).
- Хуки (`useCoffeeTypes` тощо) стають тонкими обгортками над цими фабриками — компоненти не змінюються.
- Лоадери маршрутів під `_protected` викликають `ensureQueryData` (критичні дані) або `prefetchQuery` без await (другорядні). Лоадери нічого не повертають.
- Авторизація: лоадери працюють лише на клієнті (`ssr: false` для `_protected`), бо сесія зберігається в браузері; на сервері запити до Supabase не робляться.
- Мутації та realtime-інвалідація лишаються як є, але інвалідують ключі з тих самих фабрик.

## Етапи (кожен — окремий запит)

1. **Фундамент**: `src/queries/` + фабрики для довідкових таблиць і профілів; `_protected` — `ssr: false`, `defaultPreload: "intent"` у роутері; перевірка, що поточний useSupabaseQuery сумісний (enabled за наявності user).
2. **Каталог кави**: `coffeeTypesQueryOptions`, `coffeePurchaseStatsQueryOptions`, `coffeeDetailQueryOptions(id)`; лоадери для `/coffee-catalog` і `/coffee-catalog/$id`; CoffeeDetail переведено з прямих useQuery на фабрики.
3. **Покупки**: `purchasesListQueryOptions`, `lastPurchaseTemplateQueryOptions`, distributions; лоадер `/purchases` (список — ensure, шаблон і довідники — prefetch).
4. **Дашборд**: фабрики з параметрами періоду (startDate/endDate у ключі); лоадер `/` з prefetch усіх графіків паралельно.
5. **Мої платежі, профіль, налаштування, керування користувачами**: фабрики + лоадери; MyPayments без прямих useQuery.
6. **Прибирання**: видалити дубльовані ключі/старі обгортки, зайвий `src/lib/query-client.ts`, оновити AGENTS.md правилом «дані — лише через queryOptions-фабрики».

## Технічні деталі
- Шаблон фабрики:
```text
export const coffeeTypesQuery = () => queryOptions({
  queryKey: queryKeys.coffeeTypes.all,
  queryFn: async () => unwrap(await supabase.from(...).select(...)),
});
```
- `unwrap()` — спільний хелпер (кидає помилку з повідомлення Supabase), замінює логіку з useSupabaseQuery.
- Лоадер: `loader: ({ context }) => { context.queryClient.ensureQueryData(coffeeTypesQuery()) }`; компонент — `useSuspenseQuery` або існуючий хук.
- `pendingComponent` для `_protected` — той самий спінер, що в RequireApproved; `errorComponent` з `router.invalidate()`.
- Перевірка кожного етапу: tsc, збірка, перехід між сторінками без зайвих повторних запитів (network log).
