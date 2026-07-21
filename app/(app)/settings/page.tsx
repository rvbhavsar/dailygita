'use client';

import Layout from '@/components/layout/Layout';
import SettingsPanel from '@/components/settings/SettingsPanel';

const Settings = () => (
  // fullWidth: the settings rail plus its content pane needs more room than
  // the reading column verses are set in.
  <Layout fullWidth>
    <SettingsPanel />
  </Layout>
);

export default Settings;
