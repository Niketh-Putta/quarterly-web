# quarterly-web
Quarterly landing page for UK sole traders and small landlords.

## Waitlist setup (Supabase)
1. Create a Supabase project.
2. Run SQL from `supabase/schema.sql` in the Supabase SQL editor.
3. Open `index.html` and add this snippet before `script.js`:

```html
<script>
  window.QUARTERLY_SUPABASE_URL = "https://YOUR-PROJECT.supabase.co";
  window.QUARTERLY_SUPABASE_ANON_KEY = "YOUR_ANON_KEY";
</script>
```

4. Keep RLS enabled and use only the `anon` key on the frontend.
5. Test both waitlist forms.
