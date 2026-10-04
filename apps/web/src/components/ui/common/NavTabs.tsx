import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";

export function NavTabs({
  tabs,
  activeTab,
  setActiveTab,
}: {
  tabs: { id: string; label: string }[];
  activeTab: string;
  setActiveTab: (id: string) => void;
}) {
  return (
    <Tabs
      value={activeTab}
      onChange={(_, id: string) => setActiveTab(id)}
      variant="scrollable"
      scrollButtons="auto"
      sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}
    >
      {tabs.map((tab) => (
        <Tab key={tab.id} value={tab.id} label={tab.label} />
      ))}
    </Tabs>
  );
}
