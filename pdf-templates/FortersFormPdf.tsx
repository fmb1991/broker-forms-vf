/* pdf-templates/FortersFormPdf.tsx */
import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// Optional: register a clean sans font (PDF looks nicer)
// You can skip font registration if you prefer default font
// Font.register({ family: "Inter", src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvKQ.ttf" });

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10 /*, fontFamily: "Inter"*/ },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  logo: { width: 120, height: 48, marginRight: 16 },
  title: { fontSize: 18, marginBottom: 8 },
  small: { fontSize: 9, color: "#444" },
  section: { marginTop: 16 },
  sectionTitle: { fontSize: 12, marginBottom: 8 },
  twoCol: { flexDirection: "row", gap: 12 },
  card: { border: 1, borderColor: "#DDD", borderRadius: 6, padding: 10 },
  label: { fontSize: 9, color: "#666", marginBottom: 2 },
  value: { fontSize: 10, color: "#111" },

  table: {
    display: "table",
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderColor: "#ddd",
    borderRadius: 4,
  },
  tableRow: { margin: "auto", flexDirection: "row" },
  tableColQ: { width: "55%", borderStyle: "solid", borderWidth: 1, borderLeftWidth: 0, borderTopWidth: 0, borderColor: "#ddd", padding: 6 },
  tableColA: { width: "45%", borderStyle: "solid", borderWidth: 1, borderLeftWidth: 0, borderTopWidth: 0, borderColor: "#ddd", padding: 6 },
  tableHeader: { backgroundColor: "#F5F7FA" },
  thText: { fontSize: 10, fontWeight: 700 },
  cellText: { fontSize: 10 },

  footer: { position: "absolute", bottom: 24, left: 32, right: 32, fontSize: 9, color: "#777" },
});

export type QAItem = {
  order: number;
  question: string;
  answer: string;
};

export default function FortersFormPdf({
  logoDataUrl,
  companyName,
  filledAt,
  language,
  brokerInfo,
  qaItems,
  attachments,
}: {
  logoDataUrl: string;
  companyName: string;
  filledAt?: string;
  language?: string;
  brokerInfo: {
    name: string;
    cnpj: string;
    susep: string;
  };
  qaItems: QAItem[];
  attachments: { filename: string }[];
}) {
  const dt = filledAt ? new Date(filledAt) : undefined;

  return (
    <Document>
      {/* PAGE 1 — Cover + key info */}
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          {!!logoDataUrl && <Image src={logoDataUrl} style={styles.logo} />}
          <View>
            <Text style={styles.title}>Questionário de Seguros — Respostas</Text>
            <Text style={styles.small}>Documento gerado para compartilhamento com seguradoras.</Text>
          </View>
        </View>

        <View style={[styles.section, styles.twoCol]}>
          <View style={[styles.card, { flex: 1 }]}>
            <Text style={styles.label}>Empresa</Text>
            <Text style={styles.value}>{companyName || "-"}</Text>

            <View style={{ height: 8 }} />

            <Text style={styles.label}>Idioma do formulário</Text>
            <Text style={styles.value}>{language || "-"}</Text>

            <View style={{ height: 8 }} />

            <Text style={styles.label}>Data de preenchimento</Text>
            <Text style={styles.value}>
              {dt ? `${dt.toLocaleDateString()}` : "-"}
            </Text>
          </View>

          <View style={[styles.card, { flex: 1 }]}>
            <Text style={styles.label}>Corretora</Text>
            <Text style={styles.value}>{brokerInfo.name}</Text>

            <View style={{ height: 8 }} />

            <Text style={styles.label}>CNPJ</Text>
            <Text style={styles.value}>{brokerInfo.cnpj}</Text>

            <View style={{ height: 8 }} />

            <Text style={styles.label}>SUSEP</Text>
            <Text style={styles.value}>{brokerInfo.susep}</Text>
          </View>
        </View>

        {!!attachments?.length && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Anexos enviados</Text>
            <View style={styles.card}>
              {attachments.map((f, idx) => (
                <Text key={idx} style={styles.value}>
                  • {f.filename}
                </Text>
              ))}
            </View>
          </View>
        )}

        <Text style={styles.footer}>
          Forters – Documento gerado automaticamente • {new Date().toLocaleDateString()}
        </Text>
      </Page>

      {/* PAGE 2+ — Questions & Answers */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Perguntas e Respostas</Text>

        <View style={[styles.table, { marginTop: 8 }]}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <View style={styles.tableColQ}><Text style={styles.thText}>Pergunta</Text></View>
            <View style={styles.tableColA}><Text style={styles.thText}>Resposta</Text></View>
          </View>

          {qaItems
            .sort((a, b) => a.order - b.order)
            .map((row, idx) => (
              <View key={idx} style={styles.tableRow}>
                <View style={styles.tableColQ}>
                  <Text style={styles.cellText}>{row.question}</Text>
                </View>
                <View style={styles.tableColA}>
                  <Text style={styles.cellText}>{row.answer || "-"}</Text>
                </View>
              </View>
            ))}
        </View>

        <Text style={styles.footer}>
          Forters – Q&A • {companyName || "-"}
        </Text>
      </Page>
    </Document>
  );
}
