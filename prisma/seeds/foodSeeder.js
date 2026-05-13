import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

export async function foodSeeder() {
    const categories = await prisma.category.findMany();

    if (categories.length === 0) {
        console.error("No categories found");
        return;
    }

    const foods = Array.from({ length: 20 }).map(() => {
        const randomCategories = faker.helpers.arrayElement(categories);
        return {
            name: faker.food.meat(),
            description: faker.food.description(),
            price: faker.number.int({ min: 5000, max: 100000, multipleOf: 5000 }),
            stock: faker.number.int({ min: 10, max: 100 }),
            isAvailable: faker.datatype.boolean({ probability: 0.5 }),
            categoryId: randomCategories.id,
        }
    });

    await prisma.food.createMany({
        data: foods,
    });
    console.log('Foods Seeded Successfully');
}