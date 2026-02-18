# Environment Variables Setup

Create a `.env.local` file in the root directory with the following variables:

```
# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Maps API (Optional - for address autocomplete)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

## Supabase Setup

You can find Supabase values in your Supabase project dashboard under Settings > API.

## Google Maps API Setup (Optional)

To enable address autocomplete:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Places API** and **Maps JavaScript API**
4. Go to APIs & Services > Credentials
5. Create an API key
6. (Recommended) Restrict the API key to your domain
7. Add the key to your `.env.local` file

If not configured, address fields will work as regular text inputs.

