document.addEventListener("DOMContentLoaded", function () {
  const reservaForm = document.getElementById("bookingForm");
  const confirmButton = document.querySelector(".confirm-button");
  const nomeInput = document.getElementById("nome");
  const dataNascimentoInput = document.getElementById("data-nascimento");
  const cpfInput = document.getElementById("cpf");
  const telefoneInput = document.getElementById("telefone");
  const emailInput = document.getElementById("email");
  const hotelSelect = document.getElementById("hotel");
  const quartoSelect = document.getElementById("quarto");
  const hospedesInput = document.getElementById("hospedes");
  const checkinInput = document.getElementById("checkin");
  const checkoutInput = document.getElementById("checkout");
  const resumoNome = document.getElementById("resumo-nome");
  const resumoHotel = document.getElementById("resumo-hotel");
  const resumoQuarto = document.getElementById("resumo-quarto");
  const resumoPrecoNoite = document.getElementById("resumo-preco-noite"); 
  const resumoNumNoites = document.getElementById("resumo-num-noites");   
  const resumoSubtotal = document.getElementById("resumo-subtotal");   
  const displayDiasHospedadoInput = document.getElementById("displayDiasHospedado");
  const displayValorDiariaInput = document.getElementById("displayValorDiaria");
  const displayValorAPagarInput = document.getElementById("displayValorAPagar");
  
  let precoNoiteQuartoAtual = 0; 

  if (checkinInput && checkoutInput) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;
    checkinInput.min = todayStr;

    checkinInput.addEventListener("change", function () {
      const checkinDate = new Date(this.value);
      if (isNaN(checkinDate.valueOf())) { 
          checkoutInput.min = ""; 
          checkoutInput.value = ""; 
          updateResumo();
          return;
      }
      const checkoutMinDate = new Date(checkinDate);
      checkoutMinDate.setDate(checkoutMinDate.getDate() + 1);
      const coY = checkoutMinDate.getFullYear();
      const coM = String(checkoutMinDate.getMonth() + 1).padStart(2, '0');
      const coD = String(checkoutMinDate.getDate()).padStart(2, '0');
      const minCheckoutStr = `${coY}-${coM}-${coD}`;
      checkoutInput.min = minCheckoutStr;
      if (checkoutInput.value && new Date(checkoutInput.value) < checkoutMinDate) {
        checkoutInput.value = "";
      }
      updateResumo(); 
    });
    checkoutInput.addEventListener("change", updateResumo); 
  }

  function formatCPF(inputElement) {
    if (!inputElement) return;
    let value = inputElement.value.replace(/\D/g, '');
    if (value.length > 3) value = value.replace(/^(\d{3})(\d)/, '$1.$2');
    if (value.length > 7) value = value.replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3');
    if (value.length > 11) value = value.replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
    inputElement.value = value.slice(0, 14);
  }
  if (cpfInput) cpfInput.addEventListener("input", () => formatCPF(cpfInput));

  function updateResumo() {
    console.log("--- Iniciando updateResumo ---");

    if (resumoNome && nomeInput) resumoNome.textContent = nomeInput.value || "-";
    if (resumoHotel && hotelSelect && hotelSelect.selectedIndex >=0) resumoHotel.textContent = hotelSelect.options[hotelSelect.selectedIndex]?.text || "-";
    if (resumoQuarto && quartoSelect && quartoSelect.selectedIndex >=0) resumoQuarto.textContent = quartoSelect.options[quartoSelect.selectedIndex]?.text || "-";

    let numNoitesCalculado = 0;
    let subtotalCalculado = 0;
    let precoDiariaFormatado = "--,--";

    console.log("updateResumo: precoNoiteQuartoAtual =", precoNoiteQuartoAtual);

    if (precoNoiteQuartoAtual > 0) {
      precoDiariaFormatado = precoNoiteQuartoAtual.toFixed(2);
    }
    
    if (displayValorDiariaInput) displayValorDiariaInput.value = precoDiariaFormatado;
    if (resumoPrecoNoite) resumoPrecoNoite.textContent = precoDiariaFormatado;

    if (checkinInput && checkinInput.value && checkoutInput && checkoutInput.value) {
      const dataCheckin = new Date(checkinInput.value);
      const dataCheckout = new Date(checkoutInput.value);

      if (!isNaN(dataCheckin.valueOf()) && !isNaN(dataCheckout.valueOf()) && dataCheckout > dataCheckin) {
        const diffTime = Math.abs(dataCheckout - dataCheckin);
        numNoitesCalculado = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (precoNoiteQuartoAtual > 0) {
          subtotalCalculado = numNoitesCalculado * precoNoiteQuartoAtual;
        }
      }
    }
    
    console.log("updateResumo: numNoitesCalculado =", numNoitesCalculado, "subtotalCalculado =", subtotalCalculado);

    if (displayDiasHospedadoInput) displayDiasHospedadoInput.value = numNoitesCalculado > 0 ? numNoitesCalculado : "-";
    if (displayValorAPagarInput) displayValorAPagarInput.value = subtotalCalculado > 0 ? subtotalCalculado.toFixed(2) : "--,--";
    if (resumoNumNoites) resumoNumNoites.textContent = numNoitesCalculado > 0 ? numNoitesCalculado : "-";
    if (resumoSubtotal) resumoSubtotal.textContent = subtotalCalculado > 0 ? `R$ ${subtotalCalculado.toFixed(2)}` : "R$ --,--";
    
    console.log("--- Fim updateResumo ---");
  }

  if (nomeInput) nomeInput.addEventListener("input", updateResumo);
  if (hotelSelect) hotelSelect.addEventListener("change", updateResumo);
  if (quartoSelect) quartoSelect.addEventListener("change", updateResumo);

  function getQuartoIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id') || params.get('quartoId');
  }

  async function fetchQuartoDetails(id) {
    try {
      const numericId = parseInt(id, 10);
      if (isNaN(numericId)) {
        console.error("ID do quarto da URL não é um número válido:", id);
        return null;
      }
      const response = await fetch(`http://localhost:3332/quarto/${numericId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        console.error(`Erro ao buscar detalhes do quarto (${response.status}):`, errorData.error);
        alert(`Não foi possível carregar os detalhes do quarto: ${errorData.error}`);
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error("Falha na requisição de detalhes do quarto:", error);
      alert("Falha de conexão ao buscar detalhes do quarto.");
      return null;
    }
  }

  function preencherFormularioReserva(quarto) {
    if (!quarto) {
      console.error("Dados do quarto não fornecidos para preencherFormularioReserva.");
      return;
    }
    console.log("Preenchendo formulário com:", quarto);

    if (hotelSelect && quarto.hotel_nome) {
      for (let option of hotelSelect.options) {
        if (option.textContent.trim().toLowerCase() === quarto.hotel_nome.trim().toLowerCase()) {
          option.selected = true;
          hotelSelect.disabled = true;
          break;
        }
      }
    }

    if (quartoSelect && quarto.tipo) {
      const tipoQuartoDoBackend = quarto.tipo.trim().toLowerCase();
      let quartoSelecionado = false;
      for (let option of quartoSelect.options) {
        const textoDaOpcao = option.textContent.trim().toLowerCase();
        if (textoDaOpcao === tipoQuartoDoBackend || textoDaOpcao.includes(tipoQuartoDoBackend)) {
          option.selected = true;
          quartoSelecionado = true;
          quartoSelect.disabled = true; 
          break;
        }
      }
      if (!quartoSelecionado) console.warn(`Opção não encontrada para tipo de quarto: '${quarto.tipo}'`);
    }

    if (hospedesInput && quarto.capacidade) {
      hospedesInput.value = 1; 
      hospedesInput.min = 1;
      hospedesInput.max = quarto.capacidade;
    }

    if (quarto.preco_noite) {
      precoNoiteQuartoAtual = parseFloat(quarto.preco_noite);
      console.log("preencherFormularioReserva: precoNoiteQuartoAtual definido para", precoNoiteQuartoAtual);
    } else {
      precoNoiteQuartoAtual = 0;
       console.warn("preencherFormularioReserva: quarto.preco_noite não encontrado ou inválido.");
    }
    updateResumo();
  }

  async function inicializarPaginaReserva() {
    console.log("Inicializando página de reserva...");
    const quartoId = getQuartoIdFromURL();
    if (quartoId) {
      console.log("ID do Quarto da URL:", quartoId);
      const quartoDetalhes = await fetchQuartoDetails(quartoId);
      if (quartoDetalhes) {
        preencherFormularioReserva(quartoDetalhes);
      } else {
        console.warn("Detalhes do quarto não carregados, preenchimento manual necessário.");
      }
    } else {
      console.log("Nenhum ID de quarto na URL para pré-preenchimento.");
    }
    updateResumo(); 
  }

  inicializarPaginaReserva(); 

  async function handleReservaSubmit(event) {
    event.preventDefault();
    console.log("handleReservaSubmit foi chamada!");

    const quarto_id_url = getQuartoIdFromURL();
    if (!quarto_id_url) {
      alert("Erro: ID do quarto não encontrado na URL.");
      return;
    }
    const parsedQuartoId = parseInt(quarto_id_url, 10);
    if (isNaN(parsedQuartoId)) {
      alert("Erro: ID do quarto na URL é inválido.");
      return;
    }

    if (hospedesInput && hospedesInput.max && parseInt(hospedesInput.value) > parseInt(hospedesInput.max)) {
      alert(`O nº de hóspedes (${hospedesInput.value}) excede a capacidade do quarto (${hospedesInput.max}).`);
      return;
    }
    if (hospedesInput && parseInt(hospedesInput.value) <= 0) {
      alert("O nº de hóspedes deve ser pelo menos 1.");
      return;
    }

    const formData = {
      nome: nomeInput.value,
      data_nascimento: dataNascimentoInput.value,
      cpf: cpfInput.value,
      telefone: telefoneInput.value,
      email: emailInput.value,
      quarto_id: parsedQuartoId,
      num_hospedes: parseInt(hospedesInput.value, 10),
      checkin: checkinInput.value,
      checkout: checkoutInput.value,
    };

    const requiredFields = [formData.nome, formData.data_nascimento, formData.cpf, formData.telefone, formData.email, formData.checkin, formData.checkout];
    if (requiredFields.some(field => !field) || !formData.quarto_id || formData.num_hospedes <= 0) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    if (confirmButton) {
        confirmButton.disabled = true;
        confirmButton.textContent = 'Processando...';
    }

    try {
      const response = await fetch('http://localhost:3332/reservas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await response.json().catch(() => null); 

      if (response.ok && result) {
        alert(`Reserva confirmada! ID: ${result.reserva_id}\nStatus: ${result.status}\nSubtotal: R$ ${result.subtotal}`);
        if(reservaForm) reservaForm.reset();
        precoNoiteQuartoAtual = 0;
        if(hospedesInput) hospedesInput.max = 10; 
        updateResumo(); 
        hideAllPaymentFields(); 
      } else {
        alert(`Erro ao fazer reserva: ${result?.error || response.statusText || 'Erro desconhecido.'}`);
      }
    } catch (error) {
      console.error("Erro na requisição de reserva:", error);
      alert("Erro de conexão ao tentar fazer a reserva.");
    } finally {
      if (confirmButton) {
        confirmButton.disabled = false;
        confirmButton.textContent = 'Confirmar';
      }
    }
  }

  if (reservaForm) {
    reservaForm.addEventListener("submit", handleReservaSubmit);
  }
});