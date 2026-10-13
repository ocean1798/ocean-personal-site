import "./pcb.css";
import { PcbFooter, PcbNav } from "./components/pcb/pcb-chrome";
import {
  ContactSection,
  Hero,
  MoreSection,
  MusicSection,
  PhotoSection,
  PluginsSection,
  ToolsSection,
  WorkSection,
} from "./components/pcb/home-sections";
import { PcbHomeShell } from "./components/pcb/pcb-home-shell";

export default function Home() {
  return (
    <PcbHomeShell>
      <PcbNav onHome />
      <main id="main-content">
        <Hero />
        <WorkSection />
        <PluginsSection />
        <MoreSection />
        <ToolsSection />
        <MusicSection />
        <PhotoSection />
        <ContactSection />
      </main>
      <PcbFooter />
    </PcbHomeShell>
  );
}
