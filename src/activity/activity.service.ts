import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { ItemService } from 'src/item/item.service';

type ItemType = 'artist' | 'album' | 'track';

@Injectable()
export class ActivityService {
  constructor(
    private prisma: PrismaService,
    private items: ItemService,
  ) {}

  async create(userId: number, dto: CreateActivityDto) {
    if (!dto.itemType || !dto.name) {
      throw new BadRequestException('Faltan datos del item');
    }

    const { itemId } = await this.items.ensureItemByTypeAndName(
      dto.itemType as ItemType,
      dto.name,
      { artistName: dto.artistName, albumName: dto.albumName },
    );

    const post = await this.prisma.user_activity.create({
      data: {
        user_id: userId,
        item_id: itemId,
        content: dto.content || null,
      },
    });

    return this.hydratePosts([post]).then((arr) => arr[0]);
  }

  async listByUser(userId: number, skip = 0, take = 10) {
    const posts = await this.prisma.user_activity.findMany({
      where: { user_id: userId },
      orderBy: { timestamp: 'desc' },
      skip,
      take,
    });
    const hydrated = await this.hydratePosts(posts);
    return {
      items: hydrated,
      nextCursor: posts.length === take ? skip + take : null,
    };
  }

  async removeByPolicy(postId: number, actor: { id: number; role_id: number }) {
    const post = await this.prisma.user_activity.findUnique({
      where: { id: postId },
    });
    if (!post) throw new BadRequestException('Post no existe');

    const isOwner = post.user_id === actor.id;
    const isAdminOrMod = [1, 2].includes(actor.role_id); // admin/mod
    if (!isOwner && !isAdminOrMod) {
      throw new ForbiddenException('No puedes borrar este post');
    }
    await this.prisma.user_activity.delete({ where: { id: postId } });
    return { ok: true };
  }

  private async hydratePosts(posts: any[]) {
    if (posts.length === 0) return [];

    const itemIds = posts.map((p) => p.item_id);
    const items = await this.prisma.item.findMany({
      where: { id: { in: itemIds } },
    });
    const itemsById = new Map(items.map((i) => [i.id, i]));

    const byType = {
      artist: [] as number[],
      album: [] as number[],
      track: [] as number[],
    };
    for (const it of items) {
      if (it.item_type === 'artist') byType.artist.push(it.id);
      if (it.item_type === 'album') byType.album.push(it.id);
      if (it.item_type === 'track') byType.track.push(it.id);
    }

    const [artists, albums, tracks] = await Promise.all([
      byType.artist.length
        ? this.prisma.artist.findMany({
            where: { item_id: { in: byType.artist } },
            select: { item_id: true, name: true },
          })
        : Promise.resolve([]),
      byType.album.length
        ? this.prisma.album.findMany({
            where: { item_id: { in: byType.album } },
            select: {
              item_id: true,
              name: true,
              album_artist: { select: { artist: { select: { name: true } } } },
            },
          })
        : Promise.resolve([]),
      byType.track.length
        ? this.prisma.track.findMany({
            where: { item_id: { in: byType.track } },
            select: {
              item_id: true,
              title: true,
              track_artist: { select: { artist: { select: { name: true } } } },
              track_album: { select: { album: { select: { name: true } } } },
            },
          })
        : Promise.resolve([]),
    ]);

    const metaArtist = new Map(
      artists.map((a) => [a.item_id, { title: a.name }]),
    );
    const metaAlbum = new Map(
      albums.map((a) => [
        a.item_id,
        {
          title: a.name,
          artistName: a.album_artist[0]?.artist.name || undefined,
        },
      ]),
    );
    const metaTrack = new Map(
      tracks.map((t) => [
        t.item_id,
        {
          title: t.title,
          artistName: t.track_artist[0]?.artist.name || undefined,
          albumName: t.track_album[0]?.album.name || undefined,
        },
      ]),
    );

    const userIds = Array.from(new Set(posts.map((p) => p.user_id)));
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, username: true, fullname: true, profile_pic: true },
    });
    const userById = new Map(users.map((u) => [u.id, u]));

    return posts.map((p) => {
      const it = itemsById.get(p.item_id)!;
      let display: any = { type: it.item_type };
      if (it.item_type === 'artist')
        display = { type: 'artist', ...metaArtist.get(it.id) };
      if (it.item_type === 'album')
        display = { type: 'album', ...metaAlbum.get(it.id) };
      if (it.item_type === 'track')
        display = { type: 'track', ...metaTrack.get(it.id) };

      return {
        id: p.id,
        timestamp: p.timestamp,
        content: p.content,
        itemId: p.item_id,
        itemType: it.item_type,
        display, // {type,title,artistName?,albumName?}
        author: userById.get(p.user_id),
      };
    });
  }
}
