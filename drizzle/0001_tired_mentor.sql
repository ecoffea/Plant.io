CREATE TABLE `app_users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cpf` varchar(14) NOT NULL,
	`name` varchar(255) NOT NULL,
	`phone` varchar(20) NOT NULL,
	`pix` varchar(255) NOT NULL,
	`profile` enum('consumer','producer','driver') NOT NULL,
	`address` text,
	`latitude` decimal(10,6),
	`longitude` decimal(10,6),
	`city` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `app_users_id` PRIMARY KEY(`id`),
	CONSTRAINT `app_users_cpf_unique` UNIQUE(`cpf`)
);
--> statement-breakpoint
CREATE TABLE `demands` (
	`id` int AUTO_INCREMENT NOT NULL,
	`consumerId` int NOT NULL,
	`productName` varchar(255) NOT NULL,
	`quantity` decimal(10,2) NOT NULL,
	`unit` enum('kg','unidades') NOT NULL DEFAULT 'kg',
	`city` varchar(255),
	`latitude` decimal(10,6),
	`longitude` decimal(10,6),
	`status` enum('active','accepted','paid','completed','cancelled') NOT NULL DEFAULT 'active',
	`acceptedByProducerId` int,
	`paymentConfirmed` boolean NOT NULL DEFAULT false,
	`adminConfirmed` boolean NOT NULL DEFAULT false,
	`totalPrice` decimal(10,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `demands_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `offers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`producerId` int NOT NULL,
	`productName` varchar(255) NOT NULL,
	`quantity` decimal(10,2) NOT NULL,
	`unit` enum('kg','unidades') NOT NULL DEFAULT 'kg',
	`pricePerUnit` decimal(10,2),
	`city` varchar(255),
	`latitude` decimal(10,6),
	`longitude` decimal(10,6),
	`status` enum('active','accepted','completed','cancelled') NOT NULL DEFAULT 'active',
	`acceptedByConsumerId` int,
	`paymentConfirmed` boolean NOT NULL DEFAULT false,
	`adminConfirmed` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `offers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payment_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('consumer_payment','advance_request') NOT NULL,
	`requesterId` int NOT NULL,
	`requesterName` varchar(255) NOT NULL,
	`requesterType` enum('consumer','producer','driver') NOT NULL,
	`referenceId` int NOT NULL,
	`referenceType` enum('offer','demand','trip') NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`processedAt` timestamp,
	CONSTRAINT `payment_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `product_prices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productName` varchar(255) NOT NULL,
	`basePrice` decimal(10,2) NOT NULL,
	`imageUrl` text,
	`trend` enum('up','down','stable') NOT NULL DEFAULT 'stable',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `product_prices_id` PRIMARY KEY(`id`),
	CONSTRAINT `product_prices_productName_unique` UNIQUE(`productName`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('offer','demand','trip') NOT NULL,
	`referenceId` int NOT NULL,
	`userId` int NOT NULL,
	`userType` enum('consumer','producer','driver') NOT NULL,
	`productName` varchar(255) NOT NULL,
	`quantity` decimal(10,2) NOT NULL,
	`unit` enum('kg','unidades') NOT NULL DEFAULT 'kg',
	`totalValue` decimal(10,2) NOT NULL,
	`status` enum('pending','completed','cancelled') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trips` (
	`id` int AUTO_INCREMENT NOT NULL,
	`offerId` int,
	`demandId` int,
	`driverId` int,
	`producerId` int NOT NULL,
	`consumerId` int NOT NULL,
	`productName` varchar(255) NOT NULL,
	`quantity` decimal(10,2) NOT NULL,
	`unit` enum('kg','unidades') NOT NULL DEFAULT 'kg',
	`originCity` varchar(255) NOT NULL,
	`originLatitude` decimal(10,6),
	`originLongitude` decimal(10,6),
	`destinationCity` varchar(255) NOT NULL,
	`destinationLatitude` decimal(10,6),
	`destinationLongitude` decimal(10,6),
	`distanceKm` decimal(10,2) NOT NULL,
	`freightValue` decimal(10,2) NOT NULL,
	`status` enum('available','accepted','pickup','in_transit','delivered','completed','cancelled') NOT NULL DEFAULT 'available',
	`advanceRequested` boolean NOT NULL DEFAULT false,
	`advanceApproved` boolean NOT NULL DEFAULT false,
	`driverSelfieUrl` text,
	`productPhotoUrl` text,
	`deliveryPhotoUrl` text,
	`producerPaid` boolean NOT NULL DEFAULT false,
	`driverPaid` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `trips_id` PRIMARY KEY(`id`)
);
