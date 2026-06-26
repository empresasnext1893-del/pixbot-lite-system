import sys
import os
from PIL import Image, ImageDraw, ImageFont
from datetime import datetime

def generate_receipt(type, id, amount, date, status, pix_key=None, client_name=None):
    # Dimensões do comprovante (estilo mobile)
    width = 600
    height = 850
    
    # Cores
    bg_color = (10, 15, 30)  # Dark Blue/Black
    primary_color = (65, 105, 225) # Royal Blue
    text_color = (255, 255, 255)
    muted_text = (150, 150, 170)
    success_color = (50, 205, 50) # Lime Green
    
    # Criar imagem
    img = Image.new('RGB', (width, height), color=bg_color)
    draw = ImageDraw.Draw(img)
    
    # Tentar carregar fontes, senão usar padrão
    try:
        font_bold = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 40)
        font_medium = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 24)
        font_small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 18)
        font_large = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 60)
    except:
        font_bold = ImageFont.load_default()
        font_medium = ImageFont.load_default()
        font_small = ImageFont.load_default()
        font_large = ImageFont.load_default()

    # Cabeçalho
    draw.text((width/2, 80), "PIX Bot Pagamentos", fill=primary_color, font=font_bold, anchor="mm")
    draw.text((width/2, 130), "Comprovante de Transação", fill=text_color, font=font_medium, anchor="mm")
    
    # Linha divisória
    draw.line((50, 180, width-50, 180), fill=muted_text, width=1)
    
    # Tipo de Transação
    type_label = "DEPÓSITO" if type == "deposit" else "SAQUE"
    draw.text((width/2, 230), type_label, fill=muted_text, font=font_small, anchor="mm")
    
    # Valor
    draw.text((width/2, 300), f"R$ {amount}", fill=text_color, font=font_large, anchor="mm")
    
    # Status
    status_text = "CONCLUÍDO" if status in ["completed", "approved"] else status.upper()
    draw.rectangle((width/2-100, 350, width/2+100, 390), fill=(0, 50, 0), outline=success_color)
    draw.text((width/2, 370), status_text, fill=success_color, font=font_small, anchor="mm")

    # Detalhes
    y_pos = 450
    details = [
        ("ID da Transação", f"#{id}"),
        ("Data e Hora", date),
        ("Cliente", client_name or "Não informado"),
    ]
    
    if pix_key:
        details.append(("Chave PIX", pix_key))
        
    for label, value in details:
        draw.text((70, y_pos), label, fill=muted_text, font=font_small)
        draw.text((70, y_pos + 30), value, fill=text_color, font=font_medium)
        y_pos += 90
        
    # Rodapé
    draw.line((50, 750, width-50, 750), fill=muted_text, width=1)
    draw.text((width/2, 790), "Obrigado por utilizar nossos serviços!", fill=muted_text, font=font_small, anchor="mm")
    draw.text((width/2, 815), "www.pixbot.com.br", fill=primary_color, font=font_small, anchor="mm")
    
    # Salvar
    output_path = f"/tmp/receipt_{id}.png"
    img.save(output_path)
    return output_path

if __name__ == "__main__":
    if len(sys.argv) < 6:
        print("Usage: python3 generate_receipt.py <type> <id> <amount> <date> <status> [pix_key] [client_name]")
        sys.exit(1)
        
    t = sys.argv[1]
    i = sys.argv[2]
    a = sys.argv[3]
    d = sys.argv[4]
    s = sys.argv[5]
    pk = sys.argv[6] if len(sys.argv) > 6 else None
    cn = sys.argv[7] if len(sys.argv) > 7 else None
    
    path = generate_receipt(t, i, a, d, s, pk, cn)
    print(path)
