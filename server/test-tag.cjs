const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const userId = 1; // Assuming user 1 exists, or just query first user
    const user = await prisma.user.findFirst();
    if (!user) {
      console.log('No user found');
      return;
    }

    const track = await prisma.track.findFirst();
    if (!track) {
      console.log('No track found');
      return;
    }

    console.log(`Using userId=${user.id} and trackId=${track.id}`);

    // Try to create a tag
    let tag = await prisma.tag.findFirst({
      where: { name: 'епік', userId: user.id }
    });

    if (!tag) {
      console.log('Creating tag...');
      tag = await prisma.tag.create({
        data: {
          name: 'епік',
          color: '#FF0000',
          userId: user.id
        }
      });
      console.log('Tag created:', tag);
    } else {
      console.log('Tag already exists:', tag);
    }

    // Try to attach
    console.log('Attaching tag to track...');
    const existingTrackTag = await prisma.trackTag.findUnique({
      where: {
        trackId_tagId: {
          trackId: track.id,
          tagId: tag.id
        }
      }
    });

    if (!existingTrackTag) {
      const newTrackTag = await prisma.trackTag.create({
        data: {
          trackId: track.id,
          tagId: tag.id
        }
      });
      console.log('Attached successfully:', newTrackTag);
    } else {
      console.log('Already attached');
    }

  } catch (err) {
    console.error('Error during test:', err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
