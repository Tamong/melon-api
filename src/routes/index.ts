import { Hono } from "hono";
import { chartRoutes } from "./chart";
import { songRoutes } from "./song";

const routes = new Hono();

routes.route("/chart", chartRoutes);
routes.route("/song", songRoutes);

export { chartRoutes, songRoutes };
export default routes;
