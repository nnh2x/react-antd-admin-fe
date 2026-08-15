# Shared components

Use these primitives before creating page-local alternatives:

- `PageContainer`: standard page title, description, actions, back navigation, spacing, and content card.
- `AsyncState`: consistent loading, request error, empty, and ready states.
- `ConfirmAction`: destructive/important action confirmation with async loading protection.
- `AccessControl`: declarative code/role visibility (`strategy="all" | "any"`). This is UX only; APIs must enforce authorization.
- `BasicTable`, `BasicModal`, `BasicForm`: existing data table, modal, and form primitives.

Import public components from `#src/components` so internal file layout can change without touching feature code.

```tsx
<PageContainer title="Users" extra={<Button>Add user</Button>}>
	<AsyncState loading={isLoading} error={error} isEmpty={!users.length} onRetry={refetch}>
		<BasicTable dataSource={users} columns={columns} />
	</AsyncState>
</PageContainer>;
```

Keep feature-specific components next to their page. Promote a component here only after it is reused or represents an application-wide policy.
