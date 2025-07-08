import { CreatePushSubscriptionSchema, TaskNotificationDto } from "@na/schema";
import { ValibotDto } from "@/validators/valibot.dto";

export type { TaskNotificationDto };

export class CreatePushSubscriptionDto extends ValibotDto(
  CreatePushSubscriptionSchema,
) {}
