import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ============================================
  // Plant.io - App Users
  // ============================================
  appUsers: router({
    create: publicProcedure
      .input(z.object({
        cpf: z.string().min(11).max(14),
        name: z.string().min(1).max(255),
        phone: z.string().min(10).max(20),
        pix: z.string().min(1).max(255),
        profile: z.enum(["consumer", "producer", "driver"]),
        address: z.string().optional(),
        latitude: z.string().optional(),
        longitude: z.string().optional(),
        city: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createAppUser({
          cpf: input.cpf.replace(/\D/g, ''),
          name: input.name,
          phone: input.phone,
          pix: input.pix,
          profile: input.profile,
          address: input.address,
          latitude: input.latitude,
          longitude: input.longitude,
          city: input.city,
        });
        return { id };
      }),

    getByCPF: publicProcedure
      .input(z.object({ cpf: z.string() }))
      .query(async ({ input }) => {
        return db.getAppUserByCPF(input.cpf);
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getAppUserById(input.id);
      }),

    getAll: publicProcedure.query(async () => {
      return db.getAllAppUsers();
    }),

    update: publicProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        phone: z.string().optional(),
        pix: z.string().optional(),
        address: z.string().optional(),
        latitude: z.string().optional(),
        longitude: z.string().optional(),
        city: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateAppUser(id, data);
        return { success: true };
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteAppUser(input.id);
        return { success: true };
      }),
  }),

  // ============================================
  // Plant.io - Offers (Produtores)
  // ============================================
  offers: router({
    create: publicProcedure
      .input(z.object({
        producerId: z.number(),
        productName: z.string().min(1).max(255),
        quantity: z.string(),
        unit: z.enum(["kg", "unidades"]),
        pricePerUnit: z.string().optional(),
        city: z.string().optional(),
        latitude: z.string().optional(),
        longitude: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createOffer({
          producerId: input.producerId,
          productName: input.productName,
          quantity: input.quantity,
          unit: input.unit,
          pricePerUnit: input.pricePerUnit,
          city: input.city,
          latitude: input.latitude,
          longitude: input.longitude,
        });
        return { id };
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getOfferById(input.id);
      }),

    getByProducer: publicProcedure
      .input(z.object({ producerId: z.number() }))
      .query(async ({ input }) => {
        return db.getOffersByProducer(input.producerId);
      }),

    getActive: publicProcedure.query(async () => {
      return db.getActiveOffers();
    }),

    getAll: publicProcedure.query(async () => {
      return db.getAllOffers();
    }),

    update: publicProcedure
      .input(z.object({
        id: z.number(),
        productName: z.string().optional(),
        quantity: z.string().optional(),
        unit: z.enum(["kg", "unidades"]).optional(),
        pricePerUnit: z.string().optional(),
        status: z.enum(["active", "accepted", "completed", "cancelled"]).optional(),
        acceptedByConsumerId: z.number().optional(),
        paymentConfirmed: z.boolean().optional(),
        adminConfirmed: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateOffer(id, data);
        return { success: true };
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteOffer(input.id);
        return { success: true };
      }),
  }),

  // ============================================
  // Plant.io - Demands (Consumidores)
  // ============================================
  demands: router({
    create: publicProcedure
      .input(z.object({
        consumerId: z.number(),
        productName: z.string().min(1).max(255),
        quantity: z.string(),
        unit: z.enum(["kg", "unidades"]),
        city: z.string().optional(),
        latitude: z.string().optional(),
        longitude: z.string().optional(),
        totalPrice: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createDemand({
          consumerId: input.consumerId,
          productName: input.productName,
          quantity: input.quantity,
          unit: input.unit,
          city: input.city,
          latitude: input.latitude,
          longitude: input.longitude,
          totalPrice: input.totalPrice,
        });
        return { id };
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getDemandById(input.id);
      }),

    getByConsumer: publicProcedure
      .input(z.object({ consumerId: z.number() }))
      .query(async ({ input }) => {
        return db.getDemandsByConsumer(input.consumerId);
      }),

    getActive: publicProcedure.query(async () => {
      return db.getActiveDemands();
    }),

    getPaid: publicProcedure.query(async () => {
      return db.getPaidDemands();
    }),

    getAll: publicProcedure.query(async () => {
      return db.getAllDemands();
    }),

    update: publicProcedure
      .input(z.object({
        id: z.number(),
        productName: z.string().optional(),
        quantity: z.string().optional(),
        unit: z.enum(["kg", "unidades"]).optional(),
        status: z.enum(["active", "accepted", "paid", "completed", "cancelled"]).optional(),
        acceptedByProducerId: z.number().optional(),
        paymentConfirmed: z.boolean().optional(),
        adminConfirmed: z.boolean().optional(),
        totalPrice: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateDemand(id, data);
        return { success: true };
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteDemand(input.id);
        return { success: true };
      }),
  }),

  // ============================================
  // Plant.io - Trips (Motoristas)
  // ============================================
  trips: router({
    create: publicProcedure
      .input(z.object({
        offerId: z.number().optional(),
        demandId: z.number().optional(),
        producerId: z.number(),
        consumerId: z.number(),
        productName: z.string().min(1).max(255),
        quantity: z.string(),
        unit: z.enum(["kg", "unidades"]),
        originCity: z.string(),
        originLatitude: z.string().optional(),
        originLongitude: z.string().optional(),
        destinationCity: z.string(),
        destinationLatitude: z.string().optional(),
        destinationLongitude: z.string().optional(),
        distanceKm: z.string(),
        freightValue: z.string(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createTrip({
          offerId: input.offerId,
          demandId: input.demandId,
          producerId: input.producerId,
          consumerId: input.consumerId,
          productName: input.productName,
          quantity: input.quantity,
          unit: input.unit,
          originCity: input.originCity,
          originLatitude: input.originLatitude,
          originLongitude: input.originLongitude,
          destinationCity: input.destinationCity,
          destinationLatitude: input.destinationLatitude,
          destinationLongitude: input.destinationLongitude,
          distanceKm: input.distanceKm,
          freightValue: input.freightValue,
        });
        return { id };
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getTripById(input.id);
      }),

    getByDriver: publicProcedure
      .input(z.object({ driverId: z.number() }))
      .query(async ({ input }) => {
        return db.getTripsByDriver(input.driverId);
      }),

    getAvailable: publicProcedure.query(async () => {
      return db.getAvailableTrips();
    }),

    getAll: publicProcedure.query(async () => {
      return db.getAllTrips();
    }),

    update: publicProcedure
      .input(z.object({
        id: z.number(),
        driverId: z.number().optional(),
        status: z.enum(["available", "accepted", "pickup", "in_transit", "delivered", "completed", "cancelled"]).optional(),
        advanceRequested: z.boolean().optional(),
        advanceApproved: z.boolean().optional(),
        driverSelfieUrl: z.string().optional(),
        productPhotoUrl: z.string().optional(),
        deliveryPhotoUrl: z.string().optional(),
        producerPaid: z.boolean().optional(),
        driverPaid: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateTrip(id, data);
        return { success: true };
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteTrip(input.id);
        return { success: true };
      }),
  }),

  // ============================================
  // Plant.io - Transactions (Histórico)
  // ============================================
  transactions: router({
    create: publicProcedure
      .input(z.object({
        type: z.enum(["offer", "demand", "trip"]),
        referenceId: z.number(),
        userId: z.number(),
        userType: z.enum(["consumer", "producer", "driver"]),
        productName: z.string(),
        quantity: z.string(),
        unit: z.enum(["kg", "unidades"]),
        totalValue: z.string(),
        status: z.enum(["pending", "completed", "cancelled"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createTransaction({
          type: input.type,
          referenceId: input.referenceId,
          userId: input.userId,
          userType: input.userType,
          productName: input.productName,
          quantity: input.quantity,
          unit: input.unit,
          totalValue: input.totalValue,
          status: input.status,
        });
        return { id };
      }),

    getByUser: publicProcedure
      .input(z.object({ userId: z.number(), userType: z.string() }))
      .query(async ({ input }) => {
        return db.getTransactionsByUser(input.userId, input.userType);
      }),

    getAll: publicProcedure.query(async () => {
      return db.getAllTransactions();
    }),

    update: publicProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["pending", "completed", "cancelled"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateTransaction(id, data);
        return { success: true };
      }),
  }),

  // ============================================
  // Plant.io - Product Prices (Admin)
  // ============================================
  productPrices: router({
    upsert: publicProcedure
      .input(z.object({
        productName: z.string().min(1).max(255),
        basePrice: z.string(),
        imageUrl: z.string().optional(),
        trend: z.enum(["up", "down", "stable"]).optional(),
      }))
      .mutation(async ({ input }) => {
        await db.upsertProductPrice({
          productName: input.productName,
          basePrice: input.basePrice,
          imageUrl: input.imageUrl,
          trend: input.trend,
        });
        return { success: true };
      }),

    get: publicProcedure
      .input(z.object({ productName: z.string() }))
      .query(async ({ input }) => {
        return db.getProductPrice(input.productName);
      }),

    getAll: publicProcedure.query(async () => {
      return db.getAllProductPrices();
    }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteProductPrice(input.id);
        return { success: true };
      }),
  }),

  // ============================================
  // Plant.io - Payment Requests (Admin)
  // ============================================
  paymentRequests: router({
    create: publicProcedure
      .input(z.object({
        type: z.enum(["consumer_payment", "advance_request"]),
        requesterId: z.number(),
        requesterName: z.string(),
        requesterType: z.enum(["consumer", "producer", "driver"]),
        referenceId: z.number(),
        referenceType: z.enum(["offer", "demand", "trip"]),
        amount: z.string(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createPaymentRequest({
          type: input.type,
          requesterId: input.requesterId,
          requesterName: input.requesterName,
          requesterType: input.requesterType,
          referenceId: input.referenceId,
          referenceType: input.referenceType,
          amount: input.amount,
        });
        return { id };
      }),

    getPending: publicProcedure.query(async () => {
      return db.getPendingPaymentRequests();
    }),

    getAll: publicProcedure.query(async () => {
      return db.getAllPaymentRequests();
    }),

    update: publicProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["pending", "approved", "rejected"]).optional(),
        processedAt: z.date().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updatePaymentRequest(id, data);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
