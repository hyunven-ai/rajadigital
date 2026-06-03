const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envLocal = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envLocal.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1]] = match[2];
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const settings = {
    id: 1,
    meta_title: 'RAJA DIGITAL',
    meta_description: 'Platform top-up game',
    meta_keywords: 'top up',
    ga_script: '',
    pixel_script: '',
    widget_script: '',
    wa_widget_number: '628946418541',
    wa_widget_label: 'Chat Admin',
    wa_widget_enabled: true,
    wa2_widget_number: '628123456780',
    wa2_widget_label: 'Chat Admin 2',
    wa2_widget_enabled: true,
    tg_widget_username: 'rajadigital',
    tg_widget_label: 'Telegram',
    tg_widget_enabled: false,
  };
  
  const safeFields = {
    id: 1,
    meta_title: settings.meta_title,
    meta_description: settings.meta_description,
    meta_keywords: settings.meta_keywords,
    ga_script: settings.ga_script,
    pixel_script: settings.pixel_script,
    widget_script: settings.widget_script,
    wa_widget_number: settings.wa_widget_number,
    wa_widget_label: settings.wa_widget_label,
    wa_widget_enabled: settings.wa_widget_enabled,
    tg_widget_username: settings.tg_widget_username,
    tg_widget_label: settings.tg_widget_label,
    tg_widget_enabled: settings.tg_widget_enabled,
  };

  console.log("Upserting safeFields...");
  const { error: err2 } = await supabase.from('site_settings').upsert(safeFields);
  if (err2) {
    console.error("Safe upsert error:", err2.message);
  } else {
    console.log("Safe upsert succeeded.");
  }
}

main();
