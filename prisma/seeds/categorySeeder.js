import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

export async function categorySeeder() {
    const categories = Array.from({ length: 10 }).map(() => {
        return {
            name: faker.food.ethnicCategory(),
            slug: faker.lorem.slug(3),
        }
    });

    await prisma.category.createMany({
        data: categories,
    });
    console.log('Category Seeded Successfully');
}