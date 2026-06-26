CREATE TABLE `clientAccounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`passwordHash` varchar(255) NOT NULL,
	`telegramId` varchar(64),
	`telegramName` varchar(255),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clientAccounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `clientAccounts_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`walletId` int NOT NULL,
	`clientId` int NOT NULL,
	`type` enum('deposit','withdrawal') NOT NULL,
	`status` enum('pending','approved','completed','rejected','failed') NOT NULL DEFAULT 'pending',
	`amount` decimal(15,2) NOT NULL,
	`fee` decimal(15,2) NOT NULL DEFAULT '0.00',
	`netAmount` decimal(15,2) NOT NULL,
	`pixKey` varchar(255),
	`pixKeyType` varchar(32),
	`qrCode` text,
	`copyPaste` text,
	`expiresAt` timestamp,
	`adminNote` text,
	`approvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wallets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`balance` decimal(15,2) NOT NULL DEFAULT '0.00',
	`totalDeposited` decimal(15,2) NOT NULL DEFAULT '0.00',
	`totalWithdrawn` decimal(15,2) NOT NULL DEFAULT '0.00',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `wallets_id` PRIMARY KEY(`id`)
);
