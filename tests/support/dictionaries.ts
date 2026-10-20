import { dictionaries } from "../../src/i18n";
import { ar } from "../../src/i18n/dictionaries/ar";
import { de } from "../../src/i18n/dictionaries/de";
import { en } from "../../src/i18n/dictionaries/en";
import { es } from "../../src/i18n/dictionaries/es";
import { fr } from "../../src/i18n/dictionaries/fr";
import { ur } from "../../src/i18n/dictionaries/ur";

/**
 * Every dictionary, for the tests that compare the six languages against each other.
 *
 * The app ships English and fetches the other five when a shopper chooses them, so a parity test
 * cannot wait on a download that never happens in Node. Filling the same map the translator reads
 * is what makes `translateFor("ar")` answer in Arabic here exactly as it does in a browser once
 * the file has arrived - and this file is never part of the shipped bundle.
 */
Object.assign(dictionaries, { en, ar, fr, es, ur, de });

export { dictionaries };
