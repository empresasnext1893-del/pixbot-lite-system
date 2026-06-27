CREATE TABLE `auditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`adminId` int NOT NULL,
	`action` varchar(255) NOT NULL,
	`targetType` varchar(64),
	`targetId` int,
	`details` text,
	`ipAddress` varchar(45),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `clientAccounts` ADD `lastLoginAt` timestamp;--> statement-breakpoint
ALTER TABLE `clientAccounts` ADD `customDepositFeePercent` decimal(5,2);--> statement-breakpoint
ALTER TABLE `clientAccounts` ADD `customWithdrawalFeeFixed` decimal(15,2);--> statement-breakpoint
ALTER TABLE `clientAccounts` ADD `customMinDeposit` decimal(15,2);--> statement-breakpoint
ALTER TABLE `clientAccounts` ADD `customMinWithdrawal` decimal(15,2);--> statement-breakpoint
ALTER TABLE `clientAccounts` ADD `customMaxDaily` decimal(15,2);