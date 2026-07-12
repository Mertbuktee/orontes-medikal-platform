import { describe, expect, it } from "vitest";

import {
  noopServiceRequestEventPublisher,
  type ServiceRequestDomainEvent,
} from "@/lib/domain/service-request-events";

describe("service request domain events", () => {
  it("defines notification-ready events without delivering notifications yet", async () => {
    const event = {
      type: "service_request.status_changed",
      serviceRequestId: "request_1",
      fromStatus: "REVIEWING",
      toStatus: "APPROVED",
    } satisfies ServiceRequestDomainEvent;

    await expect(noopServiceRequestEventPublisher.publish(event)).resolves.toBe(
      undefined
    );
  });
});
