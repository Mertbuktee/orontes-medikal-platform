import type { ServiceRequestStatus } from "@prisma/client";

export type ServiceRequestDomainEvent =
  | {
      type: "service_request.created";
      serviceRequestId: string;
      hasAttachment: boolean;
    }
  | {
      type: "service_request.status_changed";
      serviceRequestId: string;
      fromStatus: ServiceRequestStatus;
      toStatus: ServiceRequestStatus;
    }
  | {
      type: "service_request.note_added";
      serviceRequestId: string;
      noteId: string;
    };

export interface ServiceRequestEventPublisher {
  publish(event: ServiceRequestDomainEvent): Promise<void>;
}

export const noopServiceRequestEventPublisher: ServiceRequestEventPublisher = {
  async publish() {
    // Notification delivery is intentionally deferred to a dedicated module.
  },
};
