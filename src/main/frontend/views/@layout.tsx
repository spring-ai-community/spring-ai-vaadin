import {AppLayout} from "@vaadin/react-components";
import {NavLink, Outlet} from "react-router-dom";
import {createMenuItems} from "@vaadin/hilla-file-router/runtime.js";

export default function Layout() {

  return (
    <AppLayout>
      <div slot="drawer" className="px-m py-xl">
        { createMenuItems().map(item => (
          <NavLink to={item.to} key={item.to}> {item.title} </NavLink>
        )) }
      </div>
      <Outlet/>
    </AppLayout>
  );
}