import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';

describe('Tickets workflow (e2e)', () => {
  let app: NestFastifyApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterEach(async () => {
    await app.close();
  });

  function srv() {
    return app.getHttpAdapter().getInstance().server;
  }

  it('assign, resolve, then cannot reopen from RESOLVED', async () => {
    const t = Date.now();
    const adminEmail = `adm${t}@t.com`;
    await request(srv())
      .post('/auth/setup/admin')
      .send({
        setupSecret: 'bootstrap-secret',
        firstName: 'Ad',
        lastName: 'Min',
        email: adminEmail,
        phoneNumber: '0123456789',
        password: 'password12',
      })
      .expect((res) => {
        expect([200, 201]).toContain(res.status);
      });

    const adminLogin = await request(srv())
      .post('/auth/login')
      .send({ email: adminEmail, password: 'password12' })
      .expect((res) => {
        expect([200, 201]).toContain(res.status);
      });
    const adminTok = adminLogin.body.accessToken as string;

    const agentEmail = `ag${t}@t.com`;
    const agentRes = await request(srv())
      .post('/users/agents')
      .set('Authorization', `Bearer ${adminTok}`)
      .send({
        firstName: 'Agent',
        lastName: 'User',
        email: agentEmail,
        phoneNumber: '0123456788',
        password: 'password12',
      })
      .expect((res) => {
        expect([200, 201]).toContain(res.status);
      });
    const agentId = String(agentRes.body._id);

    const clientEmail = `cl${t}@t.com`;
    await request(srv())
      .post('/users/signup/client')
      .send({
        firstName: 'Client',
        lastName: 'User',
        email: clientEmail,
        phoneNumber: '0123456787',
        password: 'password12',
      })
      .expect((res) => {
        expect([200, 201]).toContain(res.status);
      });

    const clientLogin = await request(srv())
      .post('/auth/login')
      .send({ email: clientEmail, password: 'password12' })
      .expect((res) => {
        expect([200, 201]).toContain(res.status);
      });
    const clientTok = clientLogin.body.accessToken as string;

    const ticketRes = await request(srv())
      .post('/tickets')
      .set('Authorization', `Bearer ${clientTok}`)
      .field('title', 'Need help please')
      .field(
        'description',
        'Long enough description text for validation ten chars',
      )
      .expect((res) => {
        expect([200, 201]).toContain(res.status);
      });
    const ticketId = String(ticketRes.body._id);

    await request(srv())
      .patch('/tickets/admin/assign')
      .set('Authorization', `Bearer ${adminTok}`)
      .send({ ticketId, agentId })
      .expect(200);

    const agentLogin = await request(srv())
      .post('/auth/login')
      .send({ email: agentEmail, password: 'password12' })
      .expect((res) => {
        expect([200, 201]).toContain(res.status);
      });
    const agentTok = agentLogin.body.accessToken as string;

    await request(srv())
      .patch(`/tickets/${ticketId}/status`)
      .set('Authorization', `Bearer ${agentTok}`)
      .send({ status: 'RESOLVED' })
      .expect(200);

    await request(srv())
      .patch(`/tickets/${ticketId}/status`)
      .set('Authorization', `Bearer ${agentTok}`)
      .send({ status: 'OPEN' })
      .expect(400);
  });
});
