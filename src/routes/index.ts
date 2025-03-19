import { Hono } from "hono";
import { chartRoutes } from "./chart";
import { songRoutes } from "./song";
import { albumRoutes } from "./album";

const routes = new Hono();

routes.route("/chart", chartRoutes);
routes.route("/song", songRoutes);
routes.route("/album", albumRoutes);

export { chartRoutes, songRoutes, albumRoutes };
export default routes;
