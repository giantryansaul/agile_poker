import { RoomsService, ServerRoom } from './rooms.service';

describe('RoomsService', () => {
  let service: RoomsService;

  beforeEach(() => {
    service = new RoomsService();
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  function createRoom(): ServerRoom {
    const result = service.createRoom('host-id', 'Alice', '#ef4444', 'sock-a');
    if (!result.ok) {
      throw new Error('createRoom failed');
    }
    return result.data;
  }

  it('creates a room with a 4-letter code and the creator as host', () => {
    const room = createRoom();
    expect(room.code).toMatch(/^[A-HJ-NP-Z]{4}$/);
    expect(room.users.get('host-id')?.isHost).toBe(true);
    expect(room.phase).toBe('voting');
    expect(room.roundNumber).toBe(1);
  });

  it('rejects invalid profiles', () => {
    expect(service.createRoom('u1', '   ', '#ef4444', 's1').ok).toBe(false);
    expect(service.createRoom('u1', 'Bob', 'red', 's1').ok).toBe(false);
    expect(service.createRoom('', 'Bob', '#ef4444', 's1').ok).toBe(false);
  });

  it('lets users join with the code case-insensitively', () => {
    const room = createRoom();
    const result = service.joinRoom(
      room.code.toLowerCase(),
      'bob-id',
      'Bob',
      '#3b82f6',
      'sock-b',
    );
    expect(result.ok).toBe(true);
    expect(room.users.size).toBe(2);
    expect(room.users.get('bob-id')?.isHost).toBe(false);
  });

  it('rejects unknown room codes and duplicate names', () => {
    const room = createRoom();
    expect(service.joinRoom('ZZZZ', 'u2', 'Bob', '#3b82f6', 's2')).toEqual({
      ok: false,
      error: 'ROOM_NOT_FOUND',
    });
    expect(
      service.joinRoom(room.code, 'u2', 'alice', '#3b82f6', 's2'),
    ).toEqual({ ok: false, error: 'NAME_TAKEN' });
  });

  it('lets a rejoining user reclaim their seat with pick and host flag', () => {
    const room = createRoom();
    service.pick(room.code, 'host-id', 8);
    service.markDisconnected(room.code, 'host-id', 'sock-a');
    const result = service.joinRoom(
      room.code,
      'host-id',
      'Alice',
      '#ef4444',
      'sock-a2',
    );
    expect(result.ok).toBe(true);
    const user = room.users.get('host-id')!;
    expect(user.connected).toBe(true);
    expect(user.pick).toBe(8);
    expect(user.isHost).toBe(true);
    expect(room.users.size).toBe(1);
  });

  it('hides other users picks until revealed, but shows your own', () => {
    const room = createRoom();
    service.joinRoom(room.code, 'bob-id', 'Bob', '#3b82f6', 'sock-b');
    service.pick(room.code, 'bob-id', 13);

    const aliceView = service.toRoomState(room, 'host-id');
    const bob = aliceView.users.find((u) => u.id === 'bob-id')!;
    expect(bob.hasPicked).toBe(true);
    expect(bob.pick).toBeNull();

    const bobView = service.toRoomState(room, 'bob-id');
    expect(bobView.users.find((u) => u.id === 'bob-id')?.pick).toBe(13);
  });

  it('locks picking after flip and allows re-picking before it', () => {
    const room = createRoom();
    service.pick(room.code, 'host-id', 3);
    service.pick(room.code, 'host-id', 5);
    expect(room.users.get('host-id')?.pick).toBe(5);

    service.flip(room.code, 'host-id');
    expect(service.pick(room.code, 'host-id', 8)).toEqual({
      ok: false,
      error: 'ALREADY_REVEALED',
    });
  });

  it('only the host can flip or start a new round', () => {
    const room = createRoom();
    service.joinRoom(room.code, 'bob-id', 'Bob', '#3b82f6', 'sock-b');
    expect(service.flip(room.code, 'bob-id')).toEqual({
      ok: false,
      error: 'NOT_HOST',
    });
    expect(service.newRound(room.code, 'bob-id')).toEqual({
      ok: false,
      error: 'NOT_HOST',
    });
  });

  it('computes the average over picked users and logs the round on flip', () => {
    const room = createRoom();
    service.joinRoom(room.code, 'bob-id', 'Bob', '#3b82f6', 'sock-b');
    service.joinRoom(room.code, 'eve-id', 'Eve', '#22c55e', 'sock-c');
    service.pick(room.code, 'host-id', 5);
    service.pick(room.code, 'bob-id', 8);
    // Eve does not pick and is excluded from the average.

    service.flip(room.code, 'host-id');
    expect(room.phase).toBe('revealed');
    expect(room.average).toBe(6.5);
    expect(room.log).toHaveLength(1);
    expect(room.log[0].roundNumber).toBe(1);
    expect(room.log[0].picks).toEqual([
      { name: 'Alice', color: '#ef4444', value: 5 },
      { name: 'Bob', color: '#3b82f6', value: 8 },
    ]);
  });

  it('flip with no picks yields a null average', () => {
    const room = createRoom();
    service.flip(room.code, 'host-id');
    expect(room.average).toBeNull();
    expect(room.log[0].picks).toEqual([]);
  });

  it('new round clears picks, increments the counter, and keeps the log', () => {
    const room = createRoom();
    service.pick(room.code, 'host-id', 21);
    service.flip(room.code, 'host-id');
    service.newRound(room.code, 'host-id');

    expect(room.phase).toBe('voting');
    expect(room.roundNumber).toBe(2);
    expect(room.average).toBeNull();
    expect(room.users.get('host-id')?.pick).toBeNull();
    expect(room.log).toHaveLength(1);
  });

  it('reassigns host to the longest-present connected user on disconnect', () => {
    const room = createRoom();
    service.joinRoom(room.code, 'bob-id', 'Bob', '#3b82f6', 'sock-b');
    service.joinRoom(room.code, 'eve-id', 'Eve', '#22c55e', 'sock-c');

    service.markDisconnected(room.code, 'host-id', 'sock-a');
    expect(room.users.get('host-id')?.isHost).toBe(false);
    expect(room.users.get('bob-id')?.isHost).toBe(true);
  });

  it('ignores disconnects from a stale socket after a rejoin', () => {
    const room = createRoom();
    service.joinRoom(room.code, 'host-id', 'Alice', '#ef4444', 'sock-a2');
    const result = service.markDisconnected(room.code, 'host-id', 'sock-a');
    expect(result).toBeUndefined();
    expect(room.users.get('host-id')?.connected).toBe(true);
  });

  it('marks the room empty when the last user is removed', () => {
    const room = createRoom();
    service.removeUser(room.code, 'host-id');
    expect(room.users.size).toBe(0);
    expect(room.emptySince).not.toBeNull();
  });
});
