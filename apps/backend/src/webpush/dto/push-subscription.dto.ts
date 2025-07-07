import { PushNotificationDto, PushSubscriptionSchema } from "@na/schema";
import { ValibotDto } from "@/validators/valibot.dto";

export type { PushNotificationDto };

export class PushSubscriptionDto extends ValibotDto(PushSubscriptionSchema) {}
