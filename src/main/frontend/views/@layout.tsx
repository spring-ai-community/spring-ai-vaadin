import {
  AppLayout,
  Icon,
  SideNav,
  SideNavItem,
} from "@vaadin/react-components";
import { Outlet, useLocation, useNavigate } from "react-router";
import { createMenuItems } from "@vaadin/hilla-file-router/runtime.js";
import { useEffect } from "react";

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    function onVisualViewportChange() {
      const visualViewportHeight = window.visualViewport!.height;
      if (visualViewportHeight < document.documentElement.clientHeight) {
        document.documentElement.style.setProperty('--viewport-height', `${visualViewportHeight}px`);
      } else {
        document.documentElement.style.removeProperty('--viewport-height');
      }
    }

    window.visualViewport?.addEventListener('resize', onVisualViewportChange);

    return () =>
      window.visualViewport?.removeEventListener('resize', onVisualViewportChange);
  }, []);


  return (
    <AppLayout>
      <div slot="drawer" className="px-m py-xl">
        <SideNav onNavigate={({ path }) => navigate(path!)} location={location}>
          {createMenuItems().map(({ to, title, icon }) => (
            <SideNavItem path={to} key={to}>
              {icon ? <Icon src={icon} slot="prefix"></Icon> : <></>}
              {title}
            </SideNavItem>
          ))}
        </SideNav>
      </div>
      <Outlet/>
    </AppLayout>
  );
}
