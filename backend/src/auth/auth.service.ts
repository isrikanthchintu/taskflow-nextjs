import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { InjectModel } from "@nestjs/mongoose";
import * as bcrypt from "bcryptjs";
import { Model } from "mongoose";
import { LoginDto, RegisterDto } from "@/auth/auth.dto";
import { AppEnv } from "@/config/env";
import { AppError, notFound, unauthorized } from "@/common/errors";
import { oid } from "@/common/object-id";
import { NotificationPreference } from "@/database/schemas/activity.schema";
import { Organisation, User, UserDocument } from "@/database/schemas/identity.schema";
import { TransactionService } from "@/database/transaction.service";

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  organisationId: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly users: Model<User>,
    @InjectModel(Organisation.name) private readonly organisations: Model<Organisation>,
    @InjectModel(NotificationPreference.name) private readonly preferences: Model<NotificationPreference>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly transactions: TransactionService
  ) {}

  private toPublic(user: UserDocument): PublicUser {
    return {
      id: String(user._id),
      email: user.email,
      name: user.name,
      organisationId: String(user.organisationId)
    };
  }

  private async issue(user: UserDocument): Promise<{ accessToken: string; user: PublicUser }> {
    const accessToken = await this.jwt.signAsync({ sub: String(user._id), org: String(user.organisationId) });
    return { accessToken, user: this.toPublic(user) };
  }

  async register(dto: RegisterDto): Promise<{ accessToken: string; user: PublicUser }> {
    const email = dto.email.toLowerCase();
    if (await this.users.exists({ email })) {
      throw new AppError(409, "EMAIL_TAKEN", "An account with this email already exists.");
    }
    const rounds = this.config.getOrThrow<AppEnv>("app").bcryptRounds;
    const passwordHash = await bcrypt.hash(dto.password, rounds);
    const user = await this.transactions.run(async (session) => {
      const [organisation] = await this.organisations.create(
        [{ name: dto.organisationName ?? `${dto.name}'s organisation` }],
        { session }
      );
      const [created] = await this.users.create(
        [{ email, name: dto.name, passwordHash, organisationId: organisation._id }],
        { session }
      );
      await this.preferences.create([{ userId: created._id }], { session });
      return created;
    });
    return this.issue(user);
  }

  async login(dto: LoginDto): Promise<{ accessToken: string; user: PublicUser }> {
    const user = await this.users.findOne({ email: dto.email.toLowerCase() });
    const valid = user ? await bcrypt.compare(dto.password, user.passwordHash) : false;
    if (!user || !valid) {
      throw unauthorized("Invalid email or password.");
    }
    return this.issue(user);
  }

  async me(userId: string): Promise<PublicUser> {
    const user = await this.users.findById(oid(userId));
    if (!user) {
      throw notFound();
    }
    return this.toPublic(user);
  }
}
