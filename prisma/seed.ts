import {
  AudienceSegment,
  BusinessSegment,
  Channel,
  ContactModeTag,
  ContactSource,
  DeliveryStatus,
  CampaignStatus,
  CampaignTone,
  CampaignType,
  OccasionType,
  PrismaClient,
  Relationship,
  ScheduleFrequency,
  SubscriptionTier,
} from '@prisma/client';

const prisma = new PrismaClient();

const DEMO_PHONE = '+2348000000000';
const DEMO_COUNTRY = 'NG';

async function main() {
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 30);

  const user = await prisma.user.upsert({
    where: { phone: DEMO_PHONE },
    update: {},
    create: {
      phone: DEMO_PHONE,
      country: DEMO_COUNTRY,
      name: 'Demo User',
      businessName: "Demo User's Bakery",
      subscriptionTier: SubscriptionTier.TRIAL,
      trialEndsAt,
      consentSettings: { create: {} },
    },
  });

  console.log(`Seeded user: ${user.phone} (id: ${user.id})`);

  // Wipe existing seed data for this user so the seed script is safely re-runnable.
  await prisma.deliveryLog.deleteMany({ where: { userId: user.id } });
  await prisma.campaign.deleteMany({ where: { userId: user.id } });
  await prisma.contact.deleteMany({ where: { userId: user.id } });

  const [amina, chidi, sarah] = await Promise.all([
    prisma.contact.create({
      data: {
        userId: user.id,
        name: 'Amina Yusuf',
        phone: '+2348012345671',
        relationship: Relationship.FRIEND,
        modeTags: [ContactModeTag.PERSONAL],
        occasionType: OccasionType.BIRTHDAY,
        occasionMonth: 8,
        occasionDay: 22,
        occasionYear: 1992,
        notes: 'Loves chocolate cake',
        source: ContactSource.MANUAL,
      },
    }),
    prisma.contact.create({
      data: {
        userId: user.id,
        name: 'Chidi Okafor',
        phone: '+2348012345672',
        relationship: Relationship.FAMILY,
        modeTags: [ContactModeTag.PERSONAL, ContactModeTag.BUSINESS],
        occasionType: OccasionType.ANNIVERSARY,
        occasionMonth: 11,
        occasionDay: 3,
        occasionYear: 2015,
        businessSegment: BusinessSegment.VIP,
        notes: 'Regular customer, also a cousin',
        source: ContactSource.MANUAL,
      },
    }),
    prisma.contact.create({
      data: {
        userId: user.id,
        name: 'Sarah Bello',
        phone: '+2348012345673',
        modeTags: [ContactModeTag.BUSINESS],
        occasionType: OccasionType.BIRTHDAY,
        occasionMonth: 8,
        occasionDay: 15,
        businessSegment: BusinessSegment.RECENT_BUYER,
        notes: 'Bought a custom cake last month',
        source: ContactSource.MANUAL,
      },
    }),
  ]);

  console.log(`Seeded contacts: ${[amina, chidi, sarah].map((c) => c.name).join(', ')}`);

  const campaign = await prisma.campaign.create({
    data: {
      userId: user.id,
      name: 'August VIP Birthday Blast',
      type: CampaignType.AUTOMATED_RECURRING,
      scheduleFrequency: ScheduleFrequency.MONTHLY,
      scheduleTime: '09:00',
      audienceSegment: AudienceSegment.VIP,
      messageBody: 'Happy birthday! Enjoy 15% off your next visit this week only. — Sent via Memora',
      tone: CampaignTone.WARM_FRIENDLY,
      status: CampaignStatus.ACTIVE,
      nextRunAt: new Date(),
    },
  });

  console.log(`Seeded campaign: ${campaign.name}`);

  await prisma.deliveryLog.createMany({
    data: [
      {
        userId: user.id,
        contactId: sarah.id,
        campaignId: campaign.id,
        channel: Channel.SMS,
        recipientName: sarah.name,
        recipientPhone: sarah.phone,
        messageBody: campaign.messageBody,
        status: DeliveryStatus.SENT,
        watermarked: true,
        sentAt: new Date(),
      },
      {
        userId: user.id,
        contactId: chidi.id,
        channel: Channel.WHATSAPP,
        recipientName: chidi.name,
        recipientPhone: chidi.phone,
        messageBody: 'Happy work anniversary, Chidi! Thank you for being a loyal customer.',
        status: DeliveryStatus.PENDING,
        watermarked: true,
      },
    ],
  });

  console.log('Seeded 2 delivery log rows');
  console.log('---');
  console.log(`Demo login -> phone: ${DEMO_PHONE} (no password — passwordless login)`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
