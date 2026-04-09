import { env } from "./config/env";
import { app } from "./server/app";

app.listen(env.PORT);

console.log(`Server running on http://localhost:${env.PORT}`);

