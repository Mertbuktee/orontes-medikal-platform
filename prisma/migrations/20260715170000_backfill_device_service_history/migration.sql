INSERT INTO "DeviceServiceHistory" (
    "id",
    "serviceRequestId",
    "completedById",
    "fullName",
    "company",
    "phone",
    "email",
    "deviceBrand",
    "deviceModel",
    "deviceSerialNumber",
    "serviceSummary",
    "completedAt",
    "createdAt",
    "updatedAt"
)
SELECT
    'hist_' || sr."id",
    sr."id",
    NULL,
    sr."fullName",
    sr."company",
    sr."phone",
    sr."email",
    sr."deviceBrand",
    sr."deviceModel",
    sr."deviceSerialNumber",
    sr."message",
    sr."updatedAt",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "ServiceRequest" sr
WHERE sr."status" = 'COMPLETED'
ON CONFLICT ("serviceRequestId") DO NOTHING;
