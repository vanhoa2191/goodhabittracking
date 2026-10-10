import { describe, expect, it } from 'vitest';
import { getAffiliateCopy } from '@/lib/i18n/affiliate-copy';
import type { Language } from '@/types';

const contracts: Record<Language, {
  yearly: string;
  lifetime: string;
  paid: string;
  noMonthly: string;
  disclosure: string;
  oldScope: RegExp;
}> = {
  vi: {
    yearly: 'gói Năm', lifetime: 'Trọn đời', paid: 'thực trả',
    noMonthly: 'Gói tháng không sinh hoa hồng.',
    disclosure: 'Tên hiển thị của bạn sẽ hiện cho gia đình được giới thiệu khi họ thanh toán.',
    oldScope: /mỗi khoản thanh toán|mọi thanh toán/,
  },
  en: {
    yearly: 'yearly', lifetime: 'lifetime', paid: 'actually paid',
    noMonthly: 'Monthly plans earn no commission.',
    disclosure: 'Your display name will be shown to the referred family when they pay.',
    oldScope: /every payment|each of their payments/,
  },
  fr: {
    yearly: 'annuel', lifetime: 'à vie', paid: 'réellement payé',
    noMonthly: 'Les forfaits mensuels ne donnent droit à aucune commission.',
    disclosure: 'Votre nom d’affichage sera visible par la famille parrainée lors du paiement.',
    oldScope: /chaque paiement|chacun de ses paiements/,
  },
  de: {
    yearly: 'Jahres', lifetime: 'lebenslang', paid: 'tatsächlich gezahlten',
    noMonthly: 'Monatstarife erzeugen keine Provision.',
    disclosure: 'Dein Anzeigename wird der geworbenen Familie beim Bezahlen angezeigt.',
    oldScope: /jede Zahlung|jeder Zahlung/,
  },
  it: {
    yearly: 'annuale', lifetime: 'a vita', paid: 'effettivamente pagato',
    noMonthly: 'I piani mensili non generano commissioni.',
    disclosure: 'Il tuo nome visualizzato sarà mostrato alla famiglia invitata quando paga.',
    oldScope: /ogni pagamento|ogni suo pagamento/,
  },
  es: {
    yearly: 'anual', lifetime: 'de por vida', paid: 'realmente pagado',
    noMonthly: 'Los planes mensuales no generan comisión.',
    disclosure: 'Tu nombre visible se mostrará a la familia recomendada cuando pague.',
    oldScope: /cada pago|cada uno de sus pagos/,
  },
  zh: {
    yearly: '年度', lifetime: '终身', paid: '实际支付金额',
    noMonthly: '月度方案不产生佣金。',
    disclosure: '被推荐家庭付款时会看到你的显示名称。',
    oldScope: /每笔付款/,
  },
  ja: {
    yearly: '年間', lifetime: '生涯', paid: '実支払額',
    noMonthly: '月間プランは紹介料の対象外です。',
    disclosure: '紹介されたご家族のお支払い時に、あなたの表示名が表示されます。',
    oldScope: /各支払い|お支払いごと/,
  },
  ko: {
    yearly: '연간', lifetime: '평생', paid: '실제 결제 금액',
    noMonthly: '월간 플랜은 커미션이 발생하지 않습니다.',
    disclosure: '추천받은 가족이 결제할 때 내 표시 이름이 보입니다.',
    oldScope: /각 결제/,
  },
};

const languages = Object.keys(contracts) as Language[];

describe('affiliate money model disclosures', () => {
  it.each(languages)('limits %s commissions to actual yearly and lifetime order payments', (language) => {
    const copy = getAffiliateCopy(language);
    const contract = contracts[language];
    const intro = copy.intro(20);
    const rules = copy.rules({ percent: 20, holdDays: 40, windowDays: 365, minPayout: '200.000 ₫' });
    for (const text of [intro, rules[0]]) {
      expect(text).toMatch(/20\s?%/);
      expect(text).toContain(contract.yearly);
      expect(text).toContain(contract.lifetime);
      expect(text).toContain(contract.paid);
      expect(text).not.toMatch(contract.oldScope);
    }
    expect(rules[0]).toContain('12');
    expect(rules[0]).toContain(contract.noMonthly);
    expect(rules).toContain(contract.disclosure);
  });

  it.each(languages)('keeps %s commission rate and earning window configurable', (language) => {
    const copy = getAffiliateCopy(language);
    expect(copy.intro(17)).toMatch(/17\s?%/);
    const rules = copy.rules({ percent: 17, holdDays: 40, windowDays: 720, minPayout: '200.000 ₫' });
    expect(rules[0]).toMatch(/17\s?%/);
    expect(rules[0]).toContain('24');
  });
});
