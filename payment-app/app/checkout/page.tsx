import { createCheckoutSession } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";

export default function CheckoutPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-2 text-gray-800">订单结算</h1>
        <p className="text-sm text-gray-500 mb-6">安全支付由 Stripe 提供</p>

        {/* 订单摘要 */}
        <div className="border rounded-xl p-4 mb-6 bg-gray-50 space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>商品</span>
            <span>高级会员订阅 × 1</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>税费</span>
            <span>$0.00</span>
          </div>
          <hr className="border-gray-200" />
          <div className="flex justify-between font-semibold text-gray-800">
            <span>总计</span>
            <span>$99.00</span>
          </div>
        </div>

        {/* 支付表单 — Server Action */}
        <form action={createCheckoutSession}>
          <input type="hidden" name="productName" value="高级会员订阅" />
          <input type="hidden" name="amount" value="99" />
          <SubmitButton />
        </form>

        <p className="mt-4 text-xs text-center text-gray-400">
          点击支付即代表您同意我们的服务条款与隐私政策
        </p>
      </div>
    </main>
  );
}
