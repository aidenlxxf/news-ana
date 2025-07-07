import { ValibotDto } from "@/validators/valibot.dto";
import * as v from "valibot";

export class PushSubscriptionDto extends ValibotDto(
  v.object({
    endpoint: v.string(),
    keys: v.object({
      p256dh: v.string(),
      auth: v.string(),
    }),
  })
) {}

export interface PushNotificationDto {
  taskId: string;
  message: string;
  type: 'success' | 'error';
}
