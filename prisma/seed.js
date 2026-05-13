import { PrismaClient } from "@prisma/client";
import { categorySeeder } from "./seeds/categorySeeder.js";
import { foodSeeder } from "./seeds/foodSeeder.js";

const prisma = new PrismaClient();

const seeders = {
    category: categorySeeder,
    food: foodSeeder,
}

async function main() {
    const target = process.argv[2];

    if (target) {
        const seeder = seeders[target];

        if (!seeder) {
            console.log(`Seeder ${target} not found. Available seeders: ${Object.keys(seeders).join(', ')}`);
            return;
        }

        await seeder(prisma);
        return;
    } else {
        await categorySeeder();
        await foodSeeder();
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());