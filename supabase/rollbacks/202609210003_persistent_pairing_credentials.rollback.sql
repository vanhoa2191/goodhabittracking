begin;

revoke execute on function public.ensure_pairing_credential(uuid, uuid, text, text, text) from authenticated;
revoke execute on function public.rotate_pairing_credential(uuid, uuid, text, text, text) from authenticated;
revoke execute on function public.exchange_pairing_credential(text, text, text, text, text, text) from anon, authenticated;
revoke select on public.pairing_credentials from authenticated;

commit;
