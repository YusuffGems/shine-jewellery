/* Phase 2 seed: loads the same placeholder data the mock mode uses into PostgreSQL.
   Run: npm run db:seed   (requires @prisma/client, prisma and tsx installed) */
import { PrismaClient } from "@prisma/client";
import { createSeed } from "../lib/store/seed";
import { ROLE_PERMISSIONS } from "../lib/auth/rbac";

const prisma = new PrismaClient();

async function main() {
  const d = createSeed();

  for (const [key, perms] of Object.entries(ROLE_PERMISSIONS)) {
    const role = await prisma.role.upsert({ where: { key: key as never }, update: {}, create: { key: key as never, name: key } });
    for (const p of perms) {
      const perm = await prisma.permission.upsert({ where: { key: p }, update: {}, create: { key: p } });
      await prisma.rolePermission.upsert({ where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } }, update: {}, create: { roleId: role.id, permissionId: perm.id } });
    }
  }

  for (const c of d.categories)
    await prisma.category.upsert({ where: { slug: c.slug }, update: {}, create: { id: c.id, slug: c.slug, nameEn: c.name.en, nameAr: c.name.ar, descEn: c.description.en, descAr: c.description.ar, sort: c.sort } });

  for (const c of d.collections)
    await prisma.collection.upsert({ where: { slug: c.slug }, update: {}, create: { id: c.id, slug: c.slug, nameEn: c.name.en, nameAr: c.name.ar, descEn: c.description.en, descAr: c.description.ar, sort: c.sort, seoTitle: c.seo.title, seoDesc: c.seo.description } });

  for (const r of d.rates) {
    const metal = await prisma.metal.upsert({ where: { key: r.metal }, update: {}, create: { key: r.metal, nameEn: r.metal, nameAr: r.metal } });
    await prisma.metalPurity.upsert({ where: { id: r.id }, update: {}, create: { id: r.id, metalId: metal.id, purity: r.purity } });
    // Demo rate — replace through the live provider before launch.
    await prisma.metalRate.upsert({ where: { metalPurityId: r.id }, update: {}, create: { metalPurityId: r.id, ratePerGram: r.ratePerGram, source: r.source, status: "manual" } });
  }

  for (const b of d.branches)
    await prisma.branch.upsert({ where: { id: b.id }, update: {}, create: { id: b.id, nameEn: b.name.en, nameAr: b.name.ar, addressEn: b.address.en, addressAr: b.address.ar, city: b.city, zone: b.zone, area: b.area, services: b.services, imageIds: [], sort: b.sort } });

  console.log(`Seeded ${d.categories.length} categories, ${d.collections.length} collections, ${d.rates.length} rates, ${d.branches.length} placeholder branches.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
