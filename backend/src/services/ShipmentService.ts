import prisma from "../../config/prisma";

export class ShipmentService {
  async listPending() {
    return prisma.shipment.findMany({
      where: { status: "PENDING_ASSIGNMENT" },
      orderBy: { createdAt: "desc" },
    });
  }

  async create(cargoWeightKg: number) {
    return prisma.shipment.create({
      data: { cargoWeightKg, status: "PENDING_ASSIGNMENT" },
    });
  }

  async assignToTrip(shipmentId: number, tripId: number) {
    return prisma.shipment.update({
      where: { id: shipmentId },
      data: { status: "ASSIGNED", tripId },
    });
  }
}
