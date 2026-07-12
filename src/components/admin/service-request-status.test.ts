import { describe, expect, it } from "vitest";

import {
  canTransitionServiceRequestStatus,
  formatFileSize,
  getAllowedNextStatuses,
  getServiceRequestStatusClassName,
  getServiceRequestStatusMeta,
  serviceRequestStatusOptions,
} from "@/components/admin/service-request-status";

describe("service request admin status helpers", () => {
  it("defines labels for all workflow statuses", () => {
    expect(serviceRequestStatusOptions.map((option) => option.value)).toEqual([
      "NEW",
      "REVIEWING",
      "WAITING_FOR_CUSTOMER",
      "APPROVED",
      "IN_REPAIR",
      "COMPLETED",
      "CANCELLED",
      "ARCHIVED",
    ]);
  });

  it("returns status metadata and visual classes", () => {
    expect(getServiceRequestStatusMeta("IN_REPAIR").label).toBe("Onarımda");
    expect(getServiceRequestStatusClassName("IN_REPAIR")).toContain("orange");
  });

  it("enforces the service request transition policy", () => {
    expect(getAllowedNextStatuses("NEW")).toEqual(["REVIEWING", "CANCELLED"]);
    expect(canTransitionServiceRequestStatus("REVIEWING", "APPROVED")).toBe(
      true
    );
    expect(canTransitionServiceRequestStatus("NEW", "COMPLETED")).toBe(false);
    expect(canTransitionServiceRequestStatus("ARCHIVED", "REVIEWING")).toBe(
      false
    );
  });

  it("formats attachment sizes for admin display", () => {
    expect(formatFileSize(500)).toBe("500 B");
    expect(formatFileSize(2048)).toBe("2.0 KB");
    expect(formatFileSize(2 * 1024 * 1024)).toBe("2.0 MB");
  });
});
