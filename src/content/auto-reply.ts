/**
 * The automatic reply the contact Worker sends (docs/website-plan.md B7b), from Grant Huston <grant@hustonlogic.com>,
 * as HTML and plain text with the same words. It imports nothing, because the Worker bundles it.
 * worker/messages.ts fills `{firstName}` and `{bookingUrl}`; the first name is the only visitor input in the email.
 */
export const autoReply = {
  subject: "I got your note. Here's what happens next.",
  greeting: "Hi {firstName},",
  greetingNoName: "Hi there,",
  paragraphs: [
    "You reached out! That's the first step, and thanks for taking it. This reply is automatic, and it's the same one I build into client sites. (Consider this the demo!)",
    "The next reply is from me. I read every message myself and write back within one business day.",
  ],
  /** "{before}{linkText}{after}": the link text is the booking link in HTML; in plain text the URL follows on its own line. */
  booking: {
    before: "If you'd rather talk, ",
    linkText: "pick a time for a free 20-minute call",
    after: ".",
  },
  paragraphsAfter: [
    "A bit about how I work. I learned to build software at big companies, and I've spent the last few years building it for small and medium businesses. So you get the testing and care a big company expects, sized to what your business actually needs. No fluff and no upselling. My goal is to get you the most value for your budget, and to make your tech the easy part of your week.",
    "If there's more you want me to know, reply to this email. It comes straight to me. Please leave out passwords and client details. Anything sensitive gets handled the right way, later.",
  ],
  talkSoon: "Talk soon,",
  /** Matches Grant's Gmail signature. Inline styles only; `{bookingUrl}` is filled from providers.schedulerUrl. */
  signatureHtml:
    '<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;font-family:Arial,Helvetica,sans-serif;color:#29332D;"><tr><td style="border-left:3px solid #2B6455;padding:2px 0 2px 12px;"><div style="font-size:15px;font-weight:bold;line-height:20px;color:#29332D;">Grant Huston</div><div style="font-size:13px;line-height:18px;color:#4A5750;">Founder, Huston Logic</div><div style="font-family:Georgia,\'Times New Roman\',serif;font-style:italic;font-size:14px;line-height:20px;color:#994D34;padding-top:4px;">For the parts of the job you never signed up for</div><div style="font-size:13px;line-height:18px;padding-top:6px;"><a href="mailto:grant@hustonlogic.com" style="color:#2B6455;text-decoration:none;">grant@hustonlogic.com</a><span style="color:#B7C2BC;">&nbsp;&nbsp;|&nbsp;&nbsp;</span><a href="https://hustonlogic.com" style="color:#2B6455;text-decoration:none;">hustonlogic.com</a></div><div style="font-size:13px;line-height:18px;padding-top:2px;"><a href="{bookingUrl}" style="color:#2B6455;text-decoration:none;font-weight:bold;">Book a free 20-minute call &rarr;</a></div><div style="font-size:12px;line-height:17px;color:#4A5750;padding-top:10px;">Changed your mind? Reply &ldquo;no thanks&rdquo; and I won&rsquo;t write again.</div></td></tr></table>',
  signatureText: [
    "Grant Huston",
    "Founder, Huston Logic",
    "For the parts of the job you never signed up for",
    "grant@hustonlogic.com | hustonlogic.com",
    "Book a free 20-minute call: {bookingUrl}",
    "",
    'Changed your mind? Reply "no thanks" and I won\'t write again.',
  ],
};
