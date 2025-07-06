import { ValidationPipe } from "./validators/valibot.pipe";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({}));

  await app.listen(process.env.PORT ?? 3600);
}
bootstrap();
