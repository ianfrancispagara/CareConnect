# CareConnect - Code Standards & Best Practices

## UI/UX Standards

### Alert System

**❌ DO NOT use native browser alerts:**

```typescript
// ❌ NEVER DO THIS
alert("Success!");
window.alert("Error occurred");
```

**✅ ALWAYS use our custom Alert system:**

```typescript
// ✅ CORRECT - Use useAlert hook
import { useAlert } from "@/components/AlertProvider";

function MyComponent() {
  const { showAlert } = useAlert();

  const handleSuccess = () => {
    showAlert({
      type: "success",           // success | error | info | warning
      message: "Operation completed successfully!",
      duration: 5000,            // Optional: auto-dismiss after 5 seconds
    });
  };

  const handleError = () => {
    showAlert({
      type: "error",
      message: "Something went wrong. Please try again.",
      duration: 8000,
    });
  };

  return (
    // Your component JSX
  );
}
```

### Why Use Custom Alerts?

1. **Consistent UX** - Matches our design system and color scheme
2. **Non-blocking** - Doesn't interrupt user workflow like native alerts
3. **Accessible** - Proper ARIA labels and keyboard navigation
4. **Animated** - Smooth slide-in/out transitions with progress bar
5. **Persistent** - Can survive page reloads (uses sessionStorage)
6. **Themeable** - Automatically adapts to light/dark mode

### Alert Types & Use Cases

| Type      | Color  | Use Case                                     |
| --------- | ------ | -------------------------------------------- |
| `success` | Green  | Successful operations (save, submit, create) |
| `error`   | Red    | Failed operations, validation errors         |
| `info`    | Blue   | Informational messages, tips                 |
| `warning` | Orange | Warnings, confirmations needed               |

### Examples from Codebase

**Successful Form Submission:**

```typescript
// src/app/dashboard/referrals/create/page.tsx
if (result.success) {
  showAlert({
    type: "success",
    message:
      "Referral submitted successfully! A PSG member will review your request soon.",
    duration: 5000,
  });
  router.push("/dashboard");
}
```

**Error Handling:**

```typescript
// src/app/dashboard/appointments/book/page.tsx
if (error) {
  showAlert({
    type: "error",
    message: error.message || "Failed to book appointment",
    duration: 6000,
  });
}
```

**Warning Message:**

```typescript
showAlert({
  type: "warning",
  message: "You have unsaved changes. Please save before leaving.",
  duration: 7000,
});
```

### Manual Close

Users can close alerts by:

- Clicking the X button
- Waiting for auto-dismiss (if duration is set)

## Typography Standards

Follow the design guide hierarchy:

- **h1** (Page titles): `text-lg` (1.125rem)
- **h2** (Section titles): `text-base` (1rem)
- **Labels**: `text-sm` (0.875rem)
- **Badges**: `text-xs` (0.75rem)

## Shadow Depth System

Use layered shadows for depth:

```css
boxshadow: "0 1px 2px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.03), 0 2px 4px rgba(0,0,0,0.015)";
```

Hover effects:

```css
hover: shadow-[0_4px_16px_rgba(0, 0, 0, 0.1), 0_2px_8px_rgba (0, 0, 0, 0.06)];
```

## Color System

Use CSS variables for theming:

- `var(--primary)` - Primary brand color
- `var(--success)` - Success states (green)
- `var(--error)` - Error states (red)
- `var(--warning)` - Warning states (orange)
- `var(--info)` - Info states (blue)
- `var(--text)` - Main text color
- `var(--text-muted)` - Secondary text
- `var(--bg)` - Background color
- `var(--bg-light)` - Card/panel backgrounds
- `var(--border-muted)` - Border color

## Accessibility

- Always provide descriptive alt text for images
- Use semantic HTML (nav, main, article, section)
- Ensure proper heading hierarchy (h1 → h2 → h3)
- Include ARIA labels for icon-only buttons
- Maintain color contrast ratios (WCAG 2.1 Level AA)

## Performance

- Use `loading="lazy"` for images below the fold
- Implement code splitting for large components
- Avoid inline styles when possible (use CSS variables)
- Debounce search inputs and expensive operations

## Security

- Never trust user input - validate on both client and server
- Use RLS policies for all Supabase tables
- Implement CSRF protection for state-changing operations
- Follow RA 10173 (Data Privacy Act) guidelines

---

**Last Updated:** November 11, 2025  
**Maintained By:** CareConnect Development Team
