CREATE TABLE "fruktu_lite_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"items" jsonb NOT NULL,
	"items_count" integer NOT NULL,
	"estimated_total" numeric(10, 2) NOT NULL,
	"final_weight" numeric(8, 3),
	"final_total" numeric(10, 2),
	"payment_status" text DEFAULT 'pending',
	"phone" text NOT NULL,
	"address" text NOT NULL,
	"comment" text,
	"status" text DEFAULT 'new' NOT NULL,
	"messenger_platform" text,
	"messenger_chat_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
