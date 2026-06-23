import swaggerJsDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Gaming Marketplace API (Cesar Store)",
      version: "1.0.0",
      description: "المستندات الرسمية لـ APIs منصة متجر سيزار للألعاب - تشمل الصلاحيات، الإعلانات، الدعم الفني، وإعدادات المنصة.",
    },
    servers: [
      {
        url: "http://localhost:5000/api",
        description: "السيرفر المحلي للتطوير (Local Server)",
      },
      {
        url: "https://gaming-api-backend.vercel.app/api",
        description: "السيرفر الحي على فيرسيل (Live Production)",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "قم بوضع الـ Token هنا مباشرة بدون كلمة Bearer",
        },
      },
    },
    paths: {
      // ==================== AUTH ENDPOINTS ====================
      "/auth/register": {
        post: {
          summary: "تسجيل مستخدم جديد",
          tags: ["Auth"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    name: { type: "string", example: "Mariam Essam" },
                    email: { type: "string", example: "mariamess@test.com" },
                    password: { type: "string", example: "password123" },
                    confirmPassword: { type: "string", example: "password123" },
                    phoneNumber: { type: "string", example: "01002051747" },
                  },
                  required: ["name", "email", "password", "confirmPassword"],
                },
              },
            },
          },
          responses: {
            201: { description: "تم إنشاء الحساب بنجاح" },
            400: { description: "خطأ في التحقق من البيانات المرسلة" },
          },
        },
      },
      "/auth/login": {
        post: {
          summary: "تسجيل الدخول",
          tags: ["Auth"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    email: { type: "string", example: "mariamess@test.com" },
                    password: { type: "string", example: "password123" },
                  },
                  required: ["email", "password"],
                },
              },
            },
          },
          responses: {
            200: { description: "تم تسجيل الدخول ورجوع بيانات المستخدم والـ Token" },
            401: { description: "البريد الإلكتروني أو كلمة المرور غير صحيحة" },
          },
        },
      },
      "/auth/profile": {
        get: {
          summary: "جلب بيانات الملف الشخصي للمستخدم الحالي",
          tags: ["Auth"],
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: "بيانات الحساب الحالي" },
            401: { description: "غير مصرح - الـ Token منتهي أو غير موجود" },
          },
        },
        put: {
          summary: "تحديث بيانات الملف الشخصي",
          tags: ["Auth"],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    name: { type: "string", example: "Mariam Essam Updated" },
                    email: { type: "string", example: "mariamess@test.com" },
                    password: { type: "string", example: "newpassword123" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "تم تحديث الملف الشخصي بنجاح" },
            401: { description: "غير مصرح" },
          },
        },
      },

      // ==================== POSTS ENDPOINTS ====================
      "/posts": {
        get: {
          summary: "جلب جميع الإعلانات المقبولة (المعروضة بالمتجر)",
          tags: ["Posts"],
          responses: {
            200: { description: "قائمة بالإعلانات المقبولة" },
          },
        },
        post: {
          summary: "إنشاء إعلان جديد (مع رفع صور)",
          tags: ["Posts"],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  properties: {
                    title: { type: "string", example: "حساب ببجي ليفل 80" },
                    description: { type: "string", example: "حساب قديم ومشحون سيزونات قديمة جداً." },
                    price: { type: "number", example: 2500 },
                    category: { type: "string", example: "ببجي" },
                    images: {
                      type: "array",
                      items: { type: "string", format: "binary" },
                      description: "يمكن رفع حتى 5 صور كحد أقصى للإعلان الواحد",
                    },
                  },
                  required: ["title", "description", "price", "category"],
                },
              },
            },
          },
          responses: {
            201: { description: "تم إنشاء الإعلان وبانتظار موافقة الأدمن" },
            400: { description: "خطأ في التحقق من البيانات" },
            401: { description: "غير مصرح" },
          },
        },
      },
      "/posts/my-posts": {
        get: {
          summary: "جلب الإعلانات الخاصة بالمسخدم الحالي فقط",
          tags: ["Posts"],
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: "قائمة بإعلانات المستخدم الحالي" },
            401: { description: "غير مصرح" },
          },
        },
      },
      "/posts/pending": {
        get: {
          summary: "جلب جميع الإعلانات المعلقة بانتظار المراجعة (خاص بالأدمن)",
          tags: ["Posts"],
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: "قائمة بالإعلانات المعلقة" },
            403: { description: "صلاحيات غير كافية - للأدمن فقط" },
          },
        },
      },
      "/posts/{id}/status": {
        put: {
          summary: "تحديث حالة الإعلان بقبول أو رفض (خاص بالأدمن)",
          tags: ["Posts"],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: { type: "string" },
              description: "معرف الإعلان (Post ID)",
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", enum: ["approved", "rejected"], example: "approved" },
                    rejectionReason: { type: "string", example: "السعر غير منطقي" }
                  },
                  required: ["status"],
                },
              },
            },
          },
          responses: {
            200: { description: "تم تحديث حالة الإعلان" },
            403: { description: "صلاحيات غير كافية" },
          },
        },
      },

      // ==================== TICKETS ENDPOINTS ====================
      "/tickets": {
        get: {
          summary: "جلب جميع تذاكر الدعم الفني بالسيستم (خاص بالأدمن)",
          tags: ["Tickets"],
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: "قائمة بجميع التذاكر" },
            403: { description: "خاص بالأدمن فقط" },
          },
        },
        post: {
          summary: "إنشاء تذكرة دعم فني جديدة من قبل مستخدم",
          tags: ["Tickets"],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    subject: { type: "string", example: "مشكلة في الدفع" },
                    message: { type: "string", example: "حولت المبلغ ولم يصلني الحساب حتى الآن." },
                  },
                  required: ["subject", "message"],
                },
              },
            },
          },
          responses: {
            201: { description: "تم إنشاء التذكرة بنجاح" },
          },
        },
      },
      "/tickets/my-tickets": {
        get: {
          summary: "جلب تذاكر الدعم الفني الخاصة بالمستخدم الحالي",
          tags: ["Tickets"],
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: "قائمة بتذاكر المستخدم الحالي" },
          },
        },
      },
      "/tickets/{id}/status": {
        put: {
          summary: "تحديث حالة التذكرة (خاص بالأدمن)",
          tags: ["Tickets"],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: { type: "string" },
              description: "معرف التذكرة (Ticket ID)",
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", enum: ["open", "closed"], example: "closed" },
                  },
                  required: ["status"],
                },
              },
            },
          },
          responses: {
            200: { description: "تم تحديث حالة التذكرة بنجاح" },
          },
        },
      },

      // ==================== SETTINGS ENDPOINTS ====================
      "/settings": {
        get: {
          summary: "جلب إعدادات المنصة العامة (الروابط، أرقام التواصل، التنبيهات)",
          tags: ["Settings"],
          responses: {
            200: { description: "بيانات إعدادات المنصة الحالية" },
          },
        },
        put: {
          summary: "تحديث إعدادات المنصة بالكامل (خاص بالأدمن)",
          tags: ["Settings"],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    adminContactNumbers: {
                      type: "array",
                      items: { type: "string" },
                      example: ["01003481108", "https://wa.me/201003481108"],
                    },
                    alertMessage: {
                      type: "string",
                      example: "تنبيه هام: الإدارة غير مسؤولة عن أي تعامل خارج الموقع الرسمي.",
                    },
                    socialLinks: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          title: { type: "string", example: "جروب بيع وشراء وتبديل حسابات الواتس 🎮" },
                          subtitle: { type: "string", example: "العرض شغال من 12 صباحًا إلى 12 مساءً فقط ⏳" },
                          url: { type: "string", example: "https://chat.whatsapp.com/YOUR_LINK" },
                          platform: { type: "string", enum: ["whatsapp", "facebook", "tiktok", "telegram", "instagram", "other"], example: "whatsapp" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "تم تحديث الإعدادات بنجاح في قاعدة البيانات" },
            403: { description: "خاص بالأدمن فقط" },
          },
        },
      },
    },
  },
  apis: [],
};

const swaggerSpec = swaggerJsDoc(swaggerOptions);

export const setupSwagger = (app) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};