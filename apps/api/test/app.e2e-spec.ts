import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Top 3 loop (e2e, spec 003)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('runs the happy path: add task → today plan → entry → confirm → done', async () => {
    const server = app.getHttpServer();
    const tz = { 'x-aw-timezone': 'Europe/London' };

    const task = await request(server)
      .post('/tasks')
      .set(tz)
      .send({ title: 'Write the quarterly summary' })
      .expect(201);

    await request(server).get('/plans/today').set(tz).expect(200);

    const plan = await request(server)
      .post('/plans/today/entries')
      .set(tz)
      .send({ taskId: task.body.id })
      .expect(201);
    const entryId = plan.body.entries[0].id;

    await request(server).post('/plans/today/confirm').set(tz).expect(201);
    await request(server)
      .post(`/entries/${entryId}/status`)
      .set(tz)
      .send({ status: 'in_progress' })
      .expect(201);
    const done = await request(server)
      .post(`/entries/${entryId}/status`)
      .set(tz)
      .send({ status: 'done', actualFeedback: 'about_right' })
      .expect(201);

    expect(done.body.entries[0].status).toBe('done');
  });

  it('AC-1: rejects the 4th entry with TOP3_FULL over HTTP', async () => {
    const server = app.getHttpServer();
    const tz = { 'x-aw-timezone': 'Europe/London' };
    const ids: string[] = [];
    for (let i = 0; i < 4; i++) {
      const res = await request(server).post('/tasks').set(tz).send({ title: `task ${i}` });
      ids.push(res.body.id);
    }
    for (let i = 0; i < 3; i++) {
      await request(server).post('/plans/today/entries').set(tz).send({ taskId: ids[i] }).expect(201);
    }
    const rejected = await request(server)
      .post('/plans/today/entries')
      .set(tz)
      .send({ taskId: ids[3] })
      .expect(422);
    expect(rejected.body.code).toBe('TOP3_FULL');
  });
});
